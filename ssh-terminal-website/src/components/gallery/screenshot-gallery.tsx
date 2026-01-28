import { useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'

const screenshots = [
  {
    src: '/ssh-terminal/screenshots/terminal.png',
    alt: '终端界面',
    description: '支持多标签页的终端界面，深色主题'
  },
  {
    src: '/ssh-terminal/screenshots/terminal-noconnection.png',
    alt: '未连接状态',
    description: '优雅的未连接状态提示'
  },
  {
    src: '/ssh-terminal/screenshots/session-manage.png',
    alt: '会话管理',
    description: '卡片式会话管理，支持分组和快速连接'
  },
  {
    src: '/ssh-terminal/screenshots/settings-1.png',
    alt: '终端设置',
    description: '丰富的终端配置选项'
  },
  {
    src: '/ssh-terminal/screenshots/settings-2.png',
    alt: '主题设置',
    description: '8 种精美主题可选'
  },
]

export function ScreenshotGallery() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextScreenshot = () => {
    setCurrentIndex((prev) => (prev + 1) % screenshots.length)
  }

  const prevScreenshot = () => {
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length)
  }

  return (
    <section id="screenshots" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">应用截图</h2>

        <div className="max-w-5xl mx-auto">
          {/* Main Image */}
          <div className="relative rounded-lg overflow-hidden border">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={screenshots[currentIndex].src}
                alt={screenshots[currentIndex].alt}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-auto"
              />
            </AnimatePresence>

            {/* Navigation Buttons */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur hover:bg-background"
              onClick={prevScreenshot}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur hover:bg-background"
              onClick={nextScreenshot}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Fullscreen Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-4 bg-background/80 backdrop-blur hover:bg-background"
                >
                  <Maximize2 className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl">
                <img
                  src={screenshots[currentIndex].src}
                  alt={screenshots[currentIndex].alt}
                  className="w-full h-auto"
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Description */}
          <p className="text-center mt-6 text-muted-foreground">
            {screenshots[currentIndex].description}
          </p>

          {/* Thumbnails */}
          <div className="flex justify-center gap-3 mt-8">
            {screenshots.map((shot, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`rounded-lg overflow-hidden border transition-all ${
                  index === currentIndex
                    ? 'border-primary scale-105'
                    : 'border hover:border-primary/50'
                }`}
              >
                <img
                  src={shot.src}
                  alt={shot.alt}
                  className="w-24 h-16 object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
