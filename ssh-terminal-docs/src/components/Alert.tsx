import * as React from 'react'

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  icon?: string | React.ReactNode
  children: React.ReactNode
}

export function Alert({ type = 'info', title, icon, children }: AlertProps) {
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
    info: {
      border: '1px solid #bfdbfe',
      backgroundColor: '#eff6ff',
      color: '#1e40af'
    },
    success: {
      border: '1px solid #bbf7d0',
      backgroundColor: '#f0fdf4',
      color: '#166534'
    },
    warning: {
      border: '1px solid #fef9c3',
      backgroundColor: '#fefce8',
      color: '#854d0e'
    },
    error: {
      border: '1px solid #fecaca',
      backgroundColor: '#fef2f2',
      color: '#991b1b'
    }
  }

  const darkStyles: Record<string, React.CSSProperties> = {
    info: {
      border: '1px solid rgba(30, 58, 138, 0.15)',
      backgroundColor: 'rgba(30, 58, 138, 0.1)',
      color: '#bfdbfe'
    },
    success: {
      border: '1px solid rgba(22, 101, 52, 0.15)',
      backgroundColor: 'rgba(22, 101, 52, 0.1)',
      color: '#bbf7d0'
    },
    warning: {
      border: '1px solid rgba(133, 77, 14, 0.15)',
      backgroundColor: 'rgba(133, 77, 14, 0.1)',
      color: '#fef9c3'
    },
    error: {
      border: '1px solid rgba(153, 27, 27, 0.2)',
      backgroundColor: 'rgba(153, 27, 27, 0.15)',
      color: '#fecaca'
    }
  }

  const defaultIcons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }

  // 判断 icon 的类型并渲染
  const renderIcon = () => {
    if (icon === undefined) {
      return defaultIcons[type]
    }

    if (React.isValidElement(icon)) {
      // 如果是 React 元素（如 SVG 组件）
      const iconElement = icon as React.ReactElement<any>
      return React.cloneElement(iconElement, {
        style: {
          display: 'inline-block',
          verticalAlign: 'middle',
          width: '1.25rem',
          height: '1.25rem',
          marginRight: '0.5rem',
          ...(iconElement.props?.style || {})
        }
      })
    }

    if (typeof icon === 'string' && icon.startsWith('/')) {
      // 如果是路径字符串，渲染为图片
      return (
        <img
          src={icon}
          alt=""
          style={{
            display: 'inline-block',
            verticalAlign: 'middle',
            width: '1.25rem',
            height: '1.25rem',
            marginRight: '0.5rem'
          }}
        />
      )
    }

    // 否则作为字符串渲染
    return icon
  }

  return (
    <div style={{
      margin: '1rem 0',
      borderRadius: '0.5rem',
      border: '1px solid',
      padding: '1rem',
      ...(isDarkMode ? darkStyles[type] : styles[type])
    }}>
      {title && (
        <div style={{
          marginBottom: '0.5rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center'
        }}>
          {renderIcon()}
          <span>{title}</span>
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}