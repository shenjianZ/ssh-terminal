Add shadcn Components in vite + react.
You can now start adding components to your project.

```shell
npx shadcn@latest add button
```
The command above will add the Button component to your project. You can then import it like this:

src/App.tsx
```tsx
import { Button } from "@/components/ui/button"
 
function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Button>Click me</Button>
    </div>
  )
}
 
export default App
```