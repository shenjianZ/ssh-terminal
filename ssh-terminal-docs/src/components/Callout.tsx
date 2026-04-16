import * as React from 'react'

interface CalloutProps {
  variant?: 'default' | 'primary' | 'secondary'
  children: React.ReactNode
}

export function Callout({ variant = 'default', children }: CalloutProps) {
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'))
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    return () => observer.disconnect()
  }, [])

  const styles: Record<string, React.CSSProperties> = {
    default: {
      borderLeft: '4px solid #6b7280',
      backgroundColor: '#f9fafb'
    },
    primary: {
      borderLeft: '4px solid #3b82f6',
      backgroundColor: '#eff6ff'
    },
    secondary: {
      borderLeft: '4px solid #8b5cf6',
      backgroundColor: '#faf5ff'
    }
  }

  const darkStyles: Record<string, React.CSSProperties> = {
    default: {
      borderLeft: '4px solid rgba(75, 85, 99, 0.2)',
      backgroundColor: 'rgba(17, 24, 39, 0.2)'
    },
    primary: {
      borderLeft: '4px solid rgba(30, 58, 138, 0.2)',
      backgroundColor: 'rgba(30, 58, 138, 0.2)'
    },
    secondary: {
      borderLeft: '4px solid rgba(88, 28, 135, 0.2)',
      backgroundColor: 'rgba(88, 28, 135, 0.2)'
    }
  }

  return (
    <div style={{
      margin: '1rem 0',
      borderTopRightRadius: '0.5rem',
      borderBottomRightRadius: '0.5rem',
      padding: '1rem',
      ...(isDarkMode ? darkStyles[variant] : styles[variant])
    }}>
      {children}
    </div>
  )
}