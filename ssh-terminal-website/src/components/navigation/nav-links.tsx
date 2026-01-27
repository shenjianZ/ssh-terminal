export function NavLinks() {
  const links = [
    { name: '功能特性', href: '#features' },
    { name: '截图展示', href: '#screenshots' },
    { name: '使用指南', href: '#guide' },
    { name: '下载', href: '#download' },
  ]

  return (
    <>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-105 dark:text-muted-foreground/80 dark:hover:text-primary"
        >
          {link.name}
        </a>
      ))}
    </>
  )
}
