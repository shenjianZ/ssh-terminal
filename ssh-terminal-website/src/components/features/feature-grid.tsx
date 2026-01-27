import {
  Layers,
  FileVideo,
  Palette,
  FileSymlink,
  Keyboard,
  Shield,
  HeartPulse,
  Fingerprint,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollReveal } from '../animations/scroll-reveal'
import { motion } from 'framer-motion'

const features = [
  {
    icon: Layers,
    title: '多会话管理',
    description: '同时管理多个 SSH 连接，使用标签页快速切换',
    color: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400',
    gradient: 'from-blue-500/20 to-transparent dark:from-blue-500/10',
  },
  {
    icon: FileVideo,
    title: '终端录制',
    description: '支持 WebM/MP4 格式，同步捕获麦克风和扬声器音频',
    color: 'bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400',
    gradient: 'from-purple-500/20 to-transparent dark:from-purple-500/10',
  },
  {
    icon: Palette,
    title: '主题支持',
    description: '8 种精美主题，支持深色模式和自定义配色',
    color: 'bg-pink-500/10 text-pink-500 dark:bg-pink-500/20 dark:text-pink-400',
    gradient: 'from-pink-500/20 to-transparent dark:from-pink-500/10',
  },
  {
    icon: FileSymlink,
    title: 'SFTP 文件传输',
    description: '双窗格文件管理，支持上传、下载、重命名等操作',
    color: 'bg-green-500/10 text-green-500 dark:bg-green-500/20 dark:text-green-400',
    gradient: 'from-green-500/20 to-transparent dark:from-green-500/10',
  },
  {
    icon: Keyboard,
    title: '快捷键管理',
    description: '丰富的快捷键配置，支持自定义绑定',
    color: 'bg-orange-500/10 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400',
    gradient: 'from-orange-500/20 to-transparent dark:from-orange-500/10',
  },
  {
    icon: Shield,
    title: '加密存储',
    description: 'AES-256-GCM 加密保存密码和密钥',
    color: 'bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400',
    gradient: 'from-red-500/20 to-transparent dark:from-red-500/10',
  },
  {
    icon: HeartPulse,
    title: '心跳保活',
    description: '可配置的心跳间隔（0-120秒）防止连接断开',
    color: 'bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20 dark:text-cyan-400',
    gradient: 'from-cyan-500/20 to-transparent dark:from-cyan-500/10',
  },
  {
    icon: Fingerprint,
    title: '主机密钥验证',
    description: '自动检测 SSH 主机密钥变化并提示确认',
    color: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400',
    gradient: 'from-indigo-500/20 to-transparent dark:from-indigo-500/10',
  },
]

export function FeatureGrid() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30 dark:from-background dark:via-background dark:to-muted/10" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">核心特性</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            强大的功能集合，满足您所有的 SSH 连接需求
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <Card className="group h-full hover:shadow-2xl dark:hover:shadow-none dark:hover:shadow-2xl dark:hover:shadow-primary/5 transition-all duration-300 border border-border/50 dark:border-border/20 hover:border-primary/30 dark:hover:border-primary/20 cursor-default relative overflow-hidden">
                {/* 渐变背景装饰 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <CardHeader className="relative z-10">
                  <div className={`p-4 rounded-xl mb-4 ${feature.color} group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 shadow-lg`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors relative z-10">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
