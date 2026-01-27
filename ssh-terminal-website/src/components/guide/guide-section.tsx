import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Terminal, Package, AlertCircle } from 'lucide-react'

export function GuideSection() {
  return (
    <section id="guide" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4">使用指南</h2>
        <p className="text-center text-muted-foreground mb-12">
          快速上手 SSH Terminal
        </p>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="quickstart" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quickstart">快速开始</TabsTrigger>
              <TabsTrigger value="install">安装步骤</TabsTrigger>
              <TabsTrigger value="build">构建指南</TabsTrigger>
            </TabsList>

            <TabsContent value="quickstart" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>快速开始</CardTitle>
                  <CardDescription>3 步启动您的第一个 SSH 连接</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                    <div>
                      <h4 className="font-semibold mb-1">下载并安装</h4>
                      <p className="text-sm text-muted-foreground">从下载页面获取适用于您操作系统的安装包</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                    <div>
                      <h4 className="font-semibold mb-1">创建 SSH 连接</h4>
                      <p className="text-sm text-muted-foreground">点击"快速连接"，输入主机、端口、用户名</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                    <div>
                      <h4 className="font-semibold mb-1">开始使用</h4>
                      <p className="text-sm text-muted-foreground">连接成功后，即可在终端中输入命令</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="install" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>环境要求</CardTitle>
                  <CardDescription>确保您的系统满足以下要求</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Terminal className="h-5 w-5 text-primary" />
                      系统要求
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Windows 10/11、macOS 10.15+、Linux (Ubuntu 20.04+)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>至少 100MB 可用磁盘空间</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>4GB RAM (推荐 8GB)</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      开发环境（如需从源码构建）
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Node.js 18+</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>pnpm 10.14.0+</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Rust 1.70+</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>Windows 用户需要 Git Bash 或 WSL</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="build" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>从源码构建</CardTitle>
                  <CardDescription>按照以下步骤从源码构建应用</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">1. 克隆仓库</h4>
                    <CodeBlock>git clone https://github.com/shenjianz/ssh-terminal.git</CodeBlock>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">2. 安装依赖</h4>
                    <CodeBlock>cd ssh-terminal && pnpm install</CodeBlock>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">3. 启动开发模式</h4>
                    <CodeBlock>pnpm tauri dev</CodeBlock>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">4. 构建生产版本</h4>
                    <CodeBlock>pnpm tauri build</CodeBlock>
                    <p className="text-sm text-muted-foreground mt-2">
                      构建产物位于 <code className="px-1.5 py-0.5 rounded bg-muted">src-tauri/target/release/bundle/</code>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="relative group">
      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
        <code className="text-foreground">{children}</code>
      </pre>
    </div>
  )
}
