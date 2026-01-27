import { Terminal } from 'lucide-react'
import { ThemeToggle } from '../theme-toggle'
import { NavLinks } from './nav-links'
import { MobileMenu } from './mobile-menu'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-md rounded-lg transition-all duration-300 group-hover:bg-primary/20" />
              <Terminal className="h-7 w-7 text-primary relative" />
            </div>
            <h1 className="text-xl font-bold font-mono tracking-tight">
              SSH<span className="text-primary">_</span>Terminal
            </h1>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLinks />
            <ThemeToggle />
          </div>

          {/* Mobile Menu */}
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
