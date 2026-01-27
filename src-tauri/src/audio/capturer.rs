use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, Stream, StreamConfig, SampleFormat};
use crossbeam_channel::{Sender};
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread::JoinHandle;
use tracing::{debug, error, info, warn};

/// 系统音频捕获器
///
/// 负责捕获系统输出音频（扬声器）并传输到前端
///
/// 使用 Windows WASAPI Loopback Recording 模式
pub struct SystemAudioCapturer {
    is_recording: Arc<AtomicBool>,
    audio_sender: Option<Sender<Vec<f32>>>,  // 改为发送 Vec<f32>
    stream_thread: Option<JoinHandle<()>>,
    target_sample_rate: u32,
    channels: u16,
    /// WAV 文件写入器（用于 MVP 验证）
    wav_writer: Option<Arc<Mutex<hound::WavWriter<std::io::BufWriter<std::fs::File>>>>>,
    /// 音频增益倍数（WASAPI Loopback 捕获的音量通常较低）
    volume_gain: f32,
}

impl SystemAudioCapturer {
    /// 创建新的音频捕获器
    pub fn new() -> Result<Self, String> {
        Ok(Self {
            is_recording: Arc::new(AtomicBool::new(false)),
            audio_sender: None,
            stream_thread: None,
            target_sample_rate: 48000, // 目标采样率 48kHz
            channels: 1,                 // 单声道
            wav_writer: None,
            volume_gain: 2.0, // 音频增益 2 倍（WASAPI Loopback 捕获音量较低）
        })
    }

    /// 设置音频数据发送器
    pub fn set_audio_sender(&mut self, sender: Sender<Vec<f32>>) -> Result<(), String> {
        self.audio_sender = Some(sender);
        Ok(())
    }

    /// 开始捕获系统音频
    pub fn start(&mut self) -> Result<(), String> {
        if self.is_recording.load(Ordering::Relaxed) {
            return Err("音频捕获器已在运行".to_string());
        }

        info!("[AudioCapturer] Starting system audio capture...");

        let host = cpal::default_host();

        // 尝试获取默认输出设备（用于 Loopback Recording）
        let device = host
            .default_output_device()
            .ok_or_else(|| "未找到默认输出设备".to_string())?;

        let device_name = device
            .name()
            .unwrap_or_else(|_| "Unknown Device".to_string());
        info!("[AudioCapturer] Using output device for loopback: {}", device_name);

        // 获取支持的配置（使用默认输入配置来获取 Loopback 模式的配置）
        // 注意：Windows WASAPI Loopback 使用输出设备，但配置类似输入设备
        let supported_config = device
            .default_output_config()
            .map_err(|e| format!("获取音频配置失败: {}", e))?;

        info!(
            "[AudioCapturer] Supported config: {:?}, sample rate: {:?}",
            supported_config.channels(),
            supported_config.sample_rate()
        );

        let source_sample_rate = supported_config.sample_rate();

        // 自定义音频配置以优化音频包大小和延迟
        // 使用较大的缓冲区可以减少数据包发送频率，提高稳定性
        let buffer_size = cpal::BufferSize::Fixed(960); // 960 样本 = 20ms @ 48kHz
        let config = cpal::StreamConfig {
            channels: supported_config.channels(),
            sample_rate: source_sample_rate,
            buffer_size,
        };

        info!(
            "[AudioCapturer] Audio config - sample_rate: {:?}, channels: {:?}, buffer_size: {:?}",
            config.sample_rate,
            config.channels,
            config.buffer_size
        );

        // TODO: WAV 文件验证暂时禁用（将在优化阶段重新启用）
        // let wav_spec = hound::WavSpec {
        //     channels: config.channels,
        //     sample_rate: source_sample_rate.0,
        //     bits_per_sample: 32,
        //     sample_format: hound::SampleFormat::Float,
        // };
        // ... WAV 创建代码 ...

        let is_recording = self.is_recording.clone();
        let target_sample_rate = self.target_sample_rate;
        let wav_writer_clone = self.wav_writer.clone();
        let audio_sender_clone = self.audio_sender.clone();

        // 根据采样格式创建流
        let stream_result = match supported_config.sample_format() {
            SampleFormat::F32 => {
                Self::create_input_stream::<f32>(
                    device,
                    config,
                    is_recording,
                    target_sample_rate,
                    source_sample_rate,
                    wav_writer_clone,
                    audio_sender_clone,
                )
            }
            SampleFormat::I16 => {
                Self::create_input_stream::<i16>(
                    device,
                    config,
                    is_recording,
                    target_sample_rate,
                    source_sample_rate,
                    wav_writer_clone,
                    audio_sender_clone,
                )
            }
            SampleFormat::U16 => {
                Self::create_input_stream::<u16>(
                    device,
                    config,
                    is_recording,
                    target_sample_rate,
                    source_sample_rate,
                    wav_writer_clone,
                    audio_sender_clone,
                )
            }
            _ => {
                return Err("不支持的音频格式".to_string());
            }
        };

        self.stream_thread = Some(stream_result.map_err(|e| format!("创建音频流失败: {}", e))?);
        self.is_recording.store(true, Ordering::Relaxed);

        info!("[AudioCapturer] System audio capture started successfully");
        Ok(())
    }

    /// 创建音频输入流（用于 Loopback Recording）
    ///
    /// 注意：虽然我们使用输出设备，但在 Windows WASAPI 中，
    /// Loopback Recording 通过输入流接口实现
    fn create_input_stream<T>(
        device: Device,
        config: StreamConfig,
        is_recording: Arc<AtomicBool>,
        _target_sample_rate: u32,
        _source_sample_rate: cpal::SampleRate,
        _wav_writer: Option<Arc<Mutex<hound::WavWriter<std::io::BufWriter<std::fs::File>>>>>,
        audio_sender: Option<Sender<Vec<f32>>>,
    ) -> Result<JoinHandle<()>, String>
    where
        T: cpal::Sample + cpal::SizedSample + Into<f32> + cpal::FromSample<f32> + 'static,
    {
        let err_fn = |err: cpal::StreamError| {
            error!("[AudioCapturer] Audio stream error: {}", err);
        };

        // 注意：这里使用 build_input_stream 来捕获 Loopback 音频
        // 在 Windows WASAPI 中，输出设备可以作为输入流来捕获其 Loopback
        let stream = match device.build_input_stream(
            &config,
            move |data: &[T], _: &cpal::InputCallbackInfo| {
                // 接收到音频数据
                debug!("[AudioCapturer] Received {} audio samples", data.len());

                // 转换为 f32 并发送到前端
                if let Some(ref sender) = audio_sender {
                    let volume_gain = 2.0; // 音频增益倍数
                    let float_samples: Vec<f32> = data.iter()
                        .map(|s| {
                            let sample = (*s).into();
                            // 应用音量增益并限制在 [-1.0, 1.0] 范围内
                            let gain_sample = sample * volume_gain;
                            gain_sample.max(-1.0).min(1.0)
                        })
                        .collect();

                    // 使用阻塞发送确保不丢失数据
                    if let Err(e) = sender.send(float_samples) {
                        error!("[AudioCapturer] Failed to send audio data: {}", e);
                    }
                }

                // TODO: 写入 WAV 文件（暂时禁用）
                // if let Some(writer) = &wav_writer {
                //     ...
                // }
            },
            err_fn,
            None,
        ) {
            Ok(stream) => stream,
            Err(e) => {
                // 如果 build_input_stream 失败，可能是设备不支持 Loopback
                // 这种情况下使用输出流作为备选方案（但无法捕获音频）
                warn!("[AudioCapturer] Failed to build input stream for loopback: {}", e);
                warn!("[AudioCapturer] Falling back to output stream (no audio capture)");

                // 启动备选流线程
                let fallback_handle = Self::create_fallback_stream::<T>(
                    device,
                    config,
                    is_recording,
                );

                // 直接返回 JoinHandle，包装在 Ok 中
                return Ok(fallback_handle);
            }
        };

        // 播放流
        stream
            .play()
            .map_err(|e| format!("播放音频流失败: {}", e))?;

        // 在单独的线程中保持 Stream 存活
        let thread_handle = std::thread::spawn(move || {
            info!("[AudioCapturer] Audio stream thread started");

            // 保持线程运行，直到录音停止
            while is_recording.load(Ordering::Relaxed) {
                std::thread::sleep(std::time::Duration::from_millis(100));
            }

            info!("[AudioCapturer] Audio stream thread stopping");
            // Stream 在这里被 drop，会自动暂停
        });

        Ok(thread_handle)
    }

    /// 创建备选输出流（当 Loopback 不可用时）
    ///
    /// 这个流不会捕获音频，只是保持系统正常运行
    fn create_fallback_stream<T>(
        device: Device,
        config: StreamConfig,
        is_recording: Arc<AtomicBool>,
    ) -> JoinHandle<()>
    where
        T: cpal::Sample + cpal::SizedSample + Into<f32> + cpal::FromSample<f32> + 'static,
    {
        let err_fn = |err: cpal::StreamError| {
            error!("[AudioCapturer] Audio stream error: {}", err);
        };

        // 构建输出流（填充静音）
        let stream = device
            .build_output_stream(
                &config,
                move |data: &mut [T], _: &cpal::OutputCallbackInfo| {
                    // 填充静音
                    for sample in data.iter_mut() {
                        *sample = cpal::Sample::from_sample(0.0f32);
                    }
                },
                err_fn,
                None,
            )
            .unwrap_or_else(|e| {
                error!("[AudioCapturer] Failed to build output stream: {}", e);
                panic!("无法创建音频流");
            });

        // 播放流
        let _ = stream.play();

        // 在单独的线程中保持 Stream 存活
        std::thread::spawn(move || {
            info!("[AudioCapturer] Fallback audio stream thread started (no capture)");

            while is_recording.load(Ordering::Relaxed) {
                std::thread::sleep(std::time::Duration::from_millis(100));
            }

            info!("[AudioCapturer] Fallback audio stream thread stopping");
        })
    }

    /// 停止捕获
    pub fn stop(&mut self) {
        if !self.is_recording.load(Ordering::Relaxed) {
            return;
        }

        info!("[AudioCapturer] Stopping audio capture...");

        self.is_recording.store(false, Ordering::Relaxed);

        // 等待线程结束
        if let Some(thread_handle) = self.stream_thread.take() {
            let _ = thread_handle.join();
        }

        // 关闭 WAV 文件
        if let Some(wav_writer) = self.wav_writer.take() {
            // 从 Arc 中尝试获取 Writer 并 finalize
            if let Ok(writer) = Arc::try_unwrap(wav_writer) {
                if let Ok(writer_guard) = writer.into_inner() {
                    match writer_guard.finalize() {
                        Ok(_) => info!("[AudioCapturer] WAV file finalized successfully"),
                        Err(e) => error!("[AudioCapturer] Failed to finalize WAV file: {}", e),
                    }
                }
            }
        }

        self.audio_sender = None;

        info!("[AudioCapturer] Audio capture stopped");
    }
}

impl Drop for SystemAudioCapturer {
    fn drop(&mut self) {
        debug!("[AudioCapturer] Dropping audio capturer");
        self.stop();
    }
}
