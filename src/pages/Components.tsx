import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";

const componentCategories = [
  {
    id: "buttons",
    name: "Buttons",
    description: "Interactive button components with various styles",
    icon: "🔘"
  },
  {
    id: "badges",
    name: "Badges",
    description: "Status indicators and labels",
    icon: "🏷️"
  },
  {
    id: "cards",
    name: "Cards",
    description: "Content containers with headers and actions",
    icon: "🃏"
  },
  {
    id: "forms",
    name: "Forms",
    description: "Input fields and form controls",
    icon: "📝"
  }
];

export function Components() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-between items-center">
          <div></div>
          <ModeToggle />
        </div>
        <h1 className="text-4xl font-bold text-foreground">UI Components</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Explore the beautiful and accessible components available in this template. 
          Each component is built with accessibility and customization in mind.
        </p>
      </div>

      {/* Component Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {componentCategories.map((category) => (
          <Card key={category.id} className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">{category.icon}</span>
              </div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <CardDescription className="text-sm">
                {category.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Component Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <span>🎨</span>
            Component Showcase
          </CardTitle>
          <CardDescription>
            Interactive examples of all available components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="buttons" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="forms">Forms</TabsTrigger>
            </TabsList>

            <TabsContent value="buttons" className="space-y-8">
              {/* Button Variants */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Button Variants</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Button className="w-full">Default</Button>
                    <p className="text-xs text-center text-muted-foreground">Default</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="secondary" className="w-full">
                      Secondary
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">Secondary</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="destructive" className="w-full">
                      Destructive
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">Destructive</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      Outline
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">Outline</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full">
                      Ghost
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">Ghost</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="link" className="w-full">
                      Link
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">Link</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Button Sizes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Button Sizes</h3>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="space-y-2">
                    <Button size="sm">Small</Button>
                    <p className="text-xs text-center text-muted-foreground">Small</p>
                  </div>
                  <div className="space-y-2">
                    <Button>Default</Button>
                    <p className="text-xs text-center text-muted-foreground">Default</p>
                  </div>
                  <div className="space-y-2">
                    <Button size="lg">Large</Button>
                    <p className="text-xs text-center text-muted-foreground">Large</p>
                  </div>
                  <div className="space-y-2">
                    <Button size="icon">
                      🔍
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">Icon</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Interactive Button Demo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Interactive Demo</h3>
                <div className="p-4 border rounded-lg bg-card">
                  <div className="flex flex-wrap gap-4 items-center justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => alert('Outline button clicked!')}
                    >
                      Click Me!
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => alert('Secondary button clicked!')}
                    >
                      Try Me!
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => alert('Destructive button clicked!')}
                    >
                      Danger!
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Theme Color Demo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Theme Colors Demo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-card text-card-foreground">
                    <h4 className="font-medium mb-2">Card Background</h4>
                    <p className="text-sm text-muted-foreground">
                      This card uses the card background and foreground colors
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted text-muted-foreground">
                    <h4 className="font-medium mb-2">Muted Background</h4>
                    <p className="text-sm">
                      This card uses the muted background and foreground colors
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="badges" className="space-y-8">
              {/* Badge Variants */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Badge Variants</h3>
                                 <div className="flex flex-wrap gap-4">
                   <div className="space-y-2">
                     <Badge variant="default">
                       Default
                     </Badge>
                     <p className="text-xs text-center text-muted-foreground">Default</p>
                   </div>
                   <div className="space-y-2">
                     <Badge variant="secondary">
                       Secondary
                     </Badge>
                     <p className="text-xs text-center text-muted-foreground">Secondary</p>
                   </div>
                   <div className="space-y-2">
                     <Badge variant="destructive">
                       Destructive
                     </Badge>
                     <p className="text-xs text-center text-muted-foreground">Destructive</p>
                   </div>
                   <div className="space-y-2">
                     <Badge variant="outline">
                       Outline
                     </Badge>
                     <p className="text-xs text-center text-muted-foreground">Outline</p>
                   </div>
                 </div>
              </div>

              <Separator />

              {/* Custom Badges */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Custom Badges</h3>
                <div className="flex flex-wrap gap-4">
                  <Badge className="bg-green-500 hover:bg-green-600">
                    ✅ Success
                  </Badge>
                  <Badge className="bg-yellow-500 hover:bg-yellow-600">
                    ⚠️ Warning
                  </Badge>
                  <Badge className="bg-blue-500 hover:bg-blue-600">
                    ℹ️ Info
                  </Badge>
                  <Badge className="bg-purple-500 hover:bg-purple-600">
                    🔮 New
                  </Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cards" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Card</CardTitle>
                    <CardDescription>
                      A simple card with header and content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This is a basic card component that demonstrates the standard layout.
                    </p>
                  </CardContent>
                </Card>

                {/* Interactive Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Interactive Card</CardTitle>
                    <CardDescription>
                      Card with interactive elements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full">Action Button</Button>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        Tag 1
                      </Badge>
                      <Badge variant="outline">
                        Tag 2
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="forms" className="space-y-8">
              <div className="max-w-2xl space-y-6">
                <h3 className="text-lg font-semibold">Form Elements</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <textarea
                    placeholder="Enter your message"
                    rows={4}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none dark:border-input dark:bg-background dark:focus:ring-ring"
                  />
                </div>

                <Button className="w-full">Submit Form</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
