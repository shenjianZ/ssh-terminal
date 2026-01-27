import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '../theme-toggle'
import { motion, AnimatePresence } from 'framer-motion'

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-muted/50 dark:hover:bg-muted/20"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm dark:bg-black/60"
            />

            {/* Menu */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-64 bg-background/95 backdrop-blur-xl dark:bg-background/98 border-l shadow-2xl dark:shadow-none"
            >
              <nav className="flex flex-col p-6 space-y-4">
                <a
                  href="#features"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-muted-foreground hover:text-primary transition-all hover:pl-2 dark:text-muted-foreground/90 dark:hover:text-primary"
                >
                  功能特性
                </a>
                <a
                  href="#screenshots"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-muted-foreground hover:text-primary transition-all hover:pl-2 dark:text-muted-foreground/90 dark:hover:text-primary"
                >
                  截图展示
                </a>
                <a
                  href="#guide"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-muted-foreground hover:text-primary transition-all hover:pl-2 dark:text-muted-foreground/90 dark:hover:text-primary"
                >
                  使用指南
                </a>
                <a
                  href="#download"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-muted-foreground hover:text-primary transition-all hover:pl-2 dark:text-muted-foreground/90 dark:hover:text-primary"
                >
                  下载
                </a>
                <div className="pt-4 border-t dark:border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground/80">主题</span>
                    <ThemeToggle />
                  </div>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
