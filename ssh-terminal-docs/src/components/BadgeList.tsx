import * as React from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  children: React.ReactNode
}

interface BadgeListProps {
  children: React.ReactNode
}

function Badge({ variant = 'default', children }: BadgeProps) {
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
      backgroundColor: '#f3f4f6',
      color: '#1f2937'
    },
    success: {
      backgroundColor: '#dcfce7',
      color: '#166534'
    },
    warning: {
      backgroundColor: '#fef9c3',
      color: '#854d0e'
    },
    error: {
      backgroundColor: '#fee2e2',
      color: '#991b1b'
    },
    info: {
      backgroundColor: '#dbeafe',
      color: '#1e40af'
    }
  }

  const darkStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: 'rgba(55, 65, 81, 0.2)',
      color: '#e5e7eb'
    },
    success: {
      backgroundColor: 'rgba(22, 101, 52, 0.2)',
      color: '#bbf7d0'
    },
    warning: {
      backgroundColor: 'rgba(133, 77, 14, 0.2)',
      color: '#fef9c3'
    },
    error: {
      backgroundColor: 'rgba(153, 27, 27, 0.2)',
      color: '#fecaca'
    },
    info: {
      backgroundColor: 'rgba(30, 58, 138, 0.2)',
      color: '#bfdbfe'
    }
  }

  return (
    <span style={{
      display: 'inline-block',
      borderRadius: '9999px',
      padding: '0.25rem 0.75rem',
      fontSize: '0.875rem',
      ...(isDarkMode ? darkStyles[variant] : styles[variant])
    }}>
      {children}
    </span>
  )
}

export function BadgeList({ children }: BadgeListProps) {
  return (
    <div style={{
      margin: '1rem 0',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }}>
      {React.Children.map(children, child =>
        React.isValidElement(child) ? child : null
      )}
    </div>
  )
}

BadgeList.Badge = Badge