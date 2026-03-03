import { Terminal, Download, FileVideo, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/navigation/header";
import { ScreenshotGallery } from "@/components/gallery/screenshot-gallery";
import { FeatureGrid } from "@/components/features/feature-grid";
import { GuideSection } from "@/components/guide/guide-section";
import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { motion } from "framer-motion";
import { APP_VERSION } from "@/config/version";

function HeroSection() {
    return (
        <section className="relative py-32 overflow-hidden">
            {/* 背景网格 */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background dark:from-primary/10" />

            {/* 技术装饰线条 */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/4 left-0 w-px h-32 bg-gradient-to-b from-transparent via-primary to-transparent" />
                <div className="absolute top-1/4 right-0 w-px h-32 bg-gradient-to-b from-transparent via-primary to-transparent" />
                <div className="absolute bottom-1/4 left-1/4 w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                <div className="absolute bottom-1/4 right-1/4 w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>

            <div className="container mx-auto px-4 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center mb-8"
                >
                    <div className="relative glow-effect">
                        <div className="absolute inset-0 bg-primary/10 blur-xl rounded-2xl transition-all duration-500 animate-pulse" />
                        <Terminal className="h-32 w-32 text-primary relative" />
                        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-lg px-3 py-1 text-xs font-mono font-bold border border-primary/20">
                            {APP_VERSION}
                        </div>
                    </div>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-6xl font-bold mb-6 font-mono tracking-tight"
                >
                    <span className="text-primary">SSH</span>_Terminal
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
                >
                    基于 Tauri + React 构建的跨平台 SSH 终端
                    <br />
                    多会话管理 · 终端录制 · 主题切换 · SFTP 文件传输
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex justify-center gap-4"
                >
                    <a href="#download" className="inline-flex">
                        <Button
                            size="lg"
                            className="gap-2 font-mono glow-effect items-center"
                        >
                            <Download className="h-5 w-5" />
                            立即下载
                        </Button>
                    </a>
                    <a href="#screenshots" className="inline-flex">
                        <Button
                            size="lg"
                            variant="outline"
                            className="gap-2 font-mono items-center"
                        >
                            <FileVideo className="h-5 w-5" />
                            查看演示
                        </Button>
                    </a>
                </motion.div>

                {/* 技术指标 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex justify-center gap-6 mt-12 flex-wrap"
                >
                    {[
                        { label: "跨平台", value: "Win/macOS/Linux" },
                        { label: "开源", value: "MIT License" },
                        { label: "安全", value: "AES-256 加密" },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="flex flex-col items-center gap-1 text-muted-foreground"
                        >
                            <div className="font-mono text-sm text-primary font-semibold">
                                {stat.label}
                            </div>
                            <div className="text-xs">{stat.value}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

function TechStack() {
    const techItems = [
        {
            name: "React 19",
            icon: Terminal,
            desc: "最新 React 版本",
            color: "text-cyan-500",
            bg: "bg-cyan-500/10 dark:bg-cyan-500/20",
        },
        {
            name: "Tauri 2.0",
            icon: Zap,
            desc: "跨平台框架",
            color: "text-orange-500",
            bg: "bg-orange-500/10 dark:bg-orange-500/20",
        },
        {
            name: "shadcn/ui",
            icon: FileVideo,
            desc: "UI 组件库",
            color: "text-purple-500",
            bg: "bg-purple-500/10 dark:bg-purple-500/20",
        },
        {
            name: "Rust",
            icon: Shield,
            desc: "高性能后端",
            color: "text-red-500",
            bg: "bg-red-500/10 dark:bg-red-500/20",
        },
        {
            name: "xterm.js",
            icon: Terminal,
            desc: "终端模拟器",
            color: "text-blue-500",
            bg: "bg-blue-500/10 dark:bg-blue-500/20",
        },
        {
            name: "Tailwind CSS",
            icon: FileVideo,
            desc: "CSS 框架",
            color: "text-teal-500",
            bg: "bg-teal-500/10 dark:bg-teal-500/20",
        },
    ];

    return (
        <section className="py-20 bg-muted/30 dark:bg-muted/10">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h3 className="text-4xl font-bold mb-4 font-mono">
                        技术栈
                    </h3>
                    <p className="text-muted-foreground">现代化技术栈构建</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {techItems.map((tech, index) => (
                        <ScrollReveal key={index} delay={index * 0.1}>
                            <Card className="group hover:shadow-xl transition-all duration-300 border hover:border-primary/30 dark:hover:border-primary/20">
                                <CardHeader>
                                    <div
                                        className={`flex items-center gap-4 mb-3`}
                                    >
                                        <div
                                            className={`p-4 rounded-lg ${tech.bg} ${tech.color} group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 font-mono`}
                                        >
                                            <tech.icon className="h-6 w-6" />
                                        </div>
                                        <CardTitle className="group-hover:text-primary transition-colors font-mono">
                                            {tech.name}
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-base">
                                        {tech.desc}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

function DownloadSection() {
    return (
        <section id="download" className="py-24 bg-muted/30 dark:bg-muted/10">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <ScrollReveal>
                        <h3 className="text-4xl font-bold mb-4 font-mono">
                            开始使用
                        </h3>
                        <p className="text-muted-foreground mb-12 text-lg">
                            选择您的操作系统
                        </p>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[
                            {
                                name: "Windows",
                                desc: "x64 安装包",
                                ext: ".exe",
                                icon: "🪟",
                                color: "from-blue-500/10 to-blue-500/5",
                                available: true,
                            },
                            {
                                name: "macOS",
                                desc: "DMG 镜像文件",
                                ext: ".dmg",
                                icon: "🍎",
                                color: "from-purple-500/10 to-purple-500/5",
                                available: true,
                            },
                            {
                                name: "Linux",
                                desc: "AppImage / DEB",
                                ext: "",
                                icon: "🐧",
                                color: "from-green-500/10 to-green-500/5",
                                available: true,
                            },
                        ].map((platform, index) => (
                            <ScrollReveal key={index} delay={index * 0.1}>
                                <Card
                                    className={`group transition-all duration-300 border relative overflow-hidden ${
                                        platform.available
                                            ? "hover:shadow-2xl hover:border-primary/30 dark:hover:border-primary/20"
                                            : "opacity-50"
                                    }`}
                                >
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${platform.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                                    />

                                    {platform.available && (
                                        <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-mono font-bold px-2 py-1 rounded z-20">
                                            可用
                                        </div>
                                    )}

                                    <CardHeader className="relative z-10">
                                        <div
                                            className={`text-5xl mb-3 transition-transform duration-300 ${
                                                platform.available
                                                    ? "group-hover:scale-110"
                                                    : "grayscale opacity-50"
                                            }`}
                                        >
                                            {platform.icon}
                                        </div>
                                        <CardTitle
                                            className={`text-2xl relative z-10 font-mono ${
                                                platform.available
                                                    ? "group-hover:text-primary transition-colors"
                                                    : "text-muted-foreground"
                                            }`}
                                        >
                                            {platform.name}
                                        </CardTitle>
                                        <CardDescription className="text-base relative z-10">
                                            {platform.desc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="relative z-10">
                                        {platform.available ? (
                                            <a
                                                href="https://github.com/shenjianz/ssh-terminal/releases"
                                                className="block"
                                            >
                                                <Button className="w-full gap-2 font-mono items-center">
                                                    <Download className="h-4 w-4" />
                                                    下载
                                                    {platform.ext || "安装包"}
                                                </Button>
                                            </a>
                                        ) : (
                                            <Button
                                                disabled
                                                className="w-full gap-2 font-mono items-center cursor-not-allowed"
                                            >
                                                <Download className="h-4 w-4" />
                                                暂不可用
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </ScrollReveal>
                        ))}
                    </div>

                    <ScrollReveal>
                        <p className="text-muted-foreground text-sm">
                            访问 GitHub Releases 获取所有版本
                            <a
                                href="https://github.com/shenjianz/ssh-terminal/releases"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline ml-2 font-mono"
                            >
                                github.com/shenjianz/ssh-terminal/releases →
                            </a>
                        </p>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="border-t py-12 bg-muted/20 dark:bg-muted/5">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground font-mono">
                            © 2026 SSH Terminal. MIT License.
                        </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <a
                            href="https://github.com/shenjianz/ssh-terminal"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary font-mono transition-colors"
                        >
                            GitHub
                        </a>
                        <a
                            href="https://github.com/shenjianz/ssh-terminal/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary font-mono transition-colors"
                        >
                            Issues
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default function App() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <main>
                <HeroSection />
                <ScreenshotGallery />
                <TechStack />
                <FeatureGrid />
                <GuideSection />
                <DownloadSection />
            </main>

            <Footer />
        </div>
    );
}
