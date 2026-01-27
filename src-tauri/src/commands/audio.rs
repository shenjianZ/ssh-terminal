use crate::audio::SystemAudioCapturer;
use std::sync::{Arc, Mutex};
use tauri::{State, AppHandle, Emitter};
use tracing::info;
use cpal::traits::{HostTrait, DeviceTrait};
use crossbeam_channel::{Receiver, bounded};
use std::thread;

/// 全局音频捕获器状态
#[derive(Clone)]
pub struct AudioCapturerState {
    pub capturer: Arc<Mutex<Option<SystemAudioCapturer>>>,
    pub audio_receiver: Arc<Mutex<Option<Receiver<Vec<f32>>>>>,
}

/// 开始捕获系统音频
#[tauri::command]
pub fn audio_start_capturing(
    state: State<'_, AudioCapturerState>,
    app: AppHandle,
) -> Result<(), String> {
    info!("[AudioCommand] Starting audio capture");

    let mut capturer_guard = state.capturer.lock().map_err(|e| format!("获取锁失败: {}", e))?;

    // 如果已有捕获器，先停止
    if capturer_guard.is_some() {
        return Err("音频捕获器已在运行".to_string());
    }

    // 创建音频数据通道
    // 增加缓冲区大小到 300 个包（约 5 秒），避免音频数据丢失
    let (tx, rx) = bounded::<Vec<f32>>(300);

    let mut capturer = SystemAudioCapturer::new()?;
    capturer.set_audio_sender(tx)?;
    capturer.start()?;

    *capturer_guard = Some(capturer);

    // 启动后台任务发送音频数据到前端
    let app_clone = app.clone();
    thread::spawn(move || {
        info!("[AudioCommand] Audio event sender thread started");

        while let Ok(audio_data) = rx.recv() {
            // 将 Vec<f32> 发送到前端
            // 注意：这里使用阻塞的 recv，如果需要可以设置超时
            if let Err(e) = app_clone.emit("audio-packet", audio_data) {
                tracing::error!("[AudioCommand] Failed to emit audio packet: {}", e);
                break;
            }
        }

        info!("[AudioCommand] Audio event sender thread stopped");
    });

    info!("[AudioCommand] Audio capture started successfully");
    Ok(())
}

/// 停止捕获系统音频
#[tauri::command]
pub fn audio_stop_capturing(
    state: State<'_, AudioCapturerState>
) -> Result<(), String> {
    info!("[AudioCommand] Stopping audio capture");

    let mut capturer_guard = state.capturer.lock().map_err(|e| format!("获取锁失败: {}", e))?;

    if let Some(mut capturer) = capturer_guard.take() {
        capturer.stop();
        info!("[AudioCommand] Audio capture stopped");
        Ok(())
    } else {
        Err("音频捕获器未运行".to_string())
    }
}

/// 获取可用的音频设备列表
#[tauri::command]
pub async fn audio_list_devices() -> Result<Vec<String>, String> {
    info!("[AudioCommand] Listing audio devices");

    let host = cpal::default_host();
    let mut devices = Vec::new();

    // 列出所有设备
    if let Ok(all_devices) = host.devices() {
        for device in all_devices {
            if let Ok(name) = device.name() {
                // 检查设备是输入还是输出
                let is_input = device.default_input_config().is_ok();
                let is_output = device.default_output_config().is_ok();

                if is_input && is_output {
                    devices.push(format!("输入输出: {}", name));
                } else if is_input {
                    devices.push(format!("输入: {}", name));
                } else if is_output {
                    devices.push(format!("输出: {}", name));
                }
            }
        }
    }

    info!("[AudioCommand] Found {} audio devices", devices.len());
    Ok(devices)
}

/// 检查音频捕获是否支持
#[tauri::command]
pub async fn audio_check_support() -> Result<AudioSupportInfo, String> {
    let host = cpal::default_host();

    let has_output_device = host.default_output_device().is_some();
    let has_input_device = host.default_input_device().is_some();

    Ok(AudioSupportInfo {
        platform: std::env::consts::OS.to_string(),
        has_loopback_support: cfg!(windows), // Windows 支持 WASAPI Loopback
        has_output_device,
        has_input_device,
        supported_sample_rates: vec![44100, 48000, 96000],
    })
}

/// 音频支持信息
#[derive(serde::Serialize, Debug)]
pub struct AudioSupportInfo {
    pub platform: String,
    pub has_loopback_support: bool,
    pub has_output_device: bool,
    pub has_input_device: bool,
    pub supported_sample_rates: Vec<u32>,
}
