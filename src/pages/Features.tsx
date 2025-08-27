import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Palette, 
  Rainbow, 
  FileText, 
  Zap, 
  Settings,
  Smartphone,
  Moon,
  Accessibility,
  LucideIcon
} from "lucide-react";

interface Feature {
  name: string;
  description: string;
  icon: LucideIcon;
  status: string;
  color: string;
  details: string[];
}

interface FeatureCategory {
  category: string;
  items: Feature[];
}

const features: FeatureCategory[] = [
  {
    category: "Core Framework",
    items: [
      {
        name: "Tauri 2.0",
        description: "Cross-platform desktop applications with Rust backend",
        icon: Zap,
        status: "Latest",
        color: "from-blue-500 to-cyan-500",
        details: ["Rust backend", "Cross-platform", "Small bundle size", "Native performance"]
      },
      {
        name: "React 19",
        description: "Latest React with modern features and performance",
        icon: FileText,
        status: "New",
        color: "from-purple-500 to-pink-500",
        details: ["Concurrent features", "Server components", "Improved performance", "Modern hooks"]
      }
    ]
  },
  {
    category: "UI & Design",
    items: [
      {
        name: "shadcn/ui",
        description: "Beautiful, accessible components built with Radix UI",
        icon: Palette,
        status: "Premium",
        color: "from-emerald-500 to-teal-500",
        details: ["Accessible", "Customizable", "Type-safe", "Modern design"]
      },
      {
        name: "Tailwind CSS 4.0",
        description: "Utility-first CSS framework with modern features",
        icon: Rainbow,
        status: "Latest",
        color: "from-indigo-500 to-purple-500",
        details: ["Utility-first", "Responsive", "Dark mode", "CSS variables"]
      }
    ]
  },
  {
    category: "Development Tools",
    items: [
      {
        name: "TypeScript",
        description: "Full type safety and modern development experience",
        icon: FileText,
        status: "Stable",
        color: "from-orange-500 to-red-500",
        details: ["Type safety", "Modern ES features", "IntelliSense", "Error prevention"]
      },
      {
        name: "Vite",
        description: "Lightning fast build tool and development server",
        icon: Zap,
        status: "Fast",
        color: "from-green-500 to-emerald-500",
        details: ["Fast HMR", "ES modules", "Plugin system", "Optimized builds"]
      }
    ]
  }
];

export function Features() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Features</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Discover the powerful features that make this template the perfect starting point 
          for your next desktop application
        </p>
      </div>

      {/* Features by Category */}
      {features.map((category, categoryIndex) => (
        <div key={categoryIndex} className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              {category.category}
            </h2>
            <Separator className="w-24 mx-auto" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {category.items.map((feature, featureIndex) => (
              <Card key={featureIndex} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">{feature.name}</CardTitle>
                          <Badge className="text-xs">
                            {feature.status}
                          </Badge>
                        </div>
                        <CardDescription className="text-base">
                          {feature.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Key Benefits:</h4>
                    <ul className="space-y-2">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Additional Features */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Settings className="w-6 h-6" />
            Additional Features
          </CardTitle>
          <CardDescription>
            More tools and capabilities to enhance your development experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium">Responsive Design</h4>
              <p className="text-sm text-muted-foreground">Works on all screen sizes</p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto">
                <Moon className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium">Dark Mode</h4>
              <p className="text-sm text-muted-foreground">Built-in theme support</p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto">
                <Accessibility className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium">Accessibility</h4>
              <p className="text-sm text-muted-foreground">WCAG compliant</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
