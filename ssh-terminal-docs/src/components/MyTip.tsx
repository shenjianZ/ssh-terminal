import React from 'react'

interface MyTipProps {
  title?: string
  children: React.ReactNode
}

export function MyTip({ title, children }: MyTipProps) {
  return (
    <div className="my-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800/60 dark:bg-green-950/80">
      {title && (
        <div className="mb-2 font-semibold text-green-900 dark:text-green-100">
          💡 {title}
        </div>
      )}
      <div className="text-green-800 dark:text-green-300">{children}</div>
    </div>
  )
}