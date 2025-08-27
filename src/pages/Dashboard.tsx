import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Palette, 
  Star, 
  BookOpen, 
  Zap, 
  BarChart3, 
  Plus, 
  Settings, 
  Play,
  LucideIcon
} from "lucide-react";

interface Stat {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const stats: Stat[] = [
  {
    title: "Total Components",
    value: "24",
    description: "Available UI components",
    icon: Palette,
    color: "bg-primary"
  },
  {
    title: "Features",
    value: "12",
    description: "Core functionality",
    icon: Star,
    color: "bg-secondary"
  },
  {
    title: "Documentation",
    value: "100%",
    description: "Complete coverage",
    icon: BookOpen,
    color: "bg-primary"
  },
  {
    title: "Performance",
    value: "A+",
    description: "Lighthouse score",
    icon: Zap,
    color: "bg-secondary"
  }
];

const recentActivity = [
  { action: "Component added", component: "DataTable", time: "2 minutes ago", status: "success" },
  { action: "Feature updated", component: "Navigation", time: "1 hour ago", status: "info" },
  { action: "Bug fixed", component: "Form validation", time: "3 hours ago", status: "success" },
  { action: "Documentation", component: "API Reference", time: "1 day ago", status: "warning" }
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your Tauri development workspace</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Reports
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="group hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`w-8 h-8 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common development tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Play className="w-4 h-4 mr-2" />
              Run Development Server
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <span className="mr-2">📦</span>
              Build Application
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <span className="mr-2">🧪</span>
              Run Tests
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <span className="mr-2">📖</span>
              View Documentation
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋</span>
              Recent Activity
            </CardTitle>
            <CardDescription>Latest development updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.component}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                    <Badge className="text-xs border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📊</span>
            Project Status
          </CardTitle>
          <CardDescription>Current development progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Frontend</span>
                <Badge className="bg-primary text-primary-foreground hover:bg-primary/80">Complete</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Backend</span>
                <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary/80">In Progress</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Testing</span>
                <Badge className="border border-input bg-background hover:bg-accent hover:text-accent-foreground">Pending</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-muted-foreground h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
