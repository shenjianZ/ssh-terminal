import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Features } from "@/pages/Features";
import { Components } from "@/pages/Components";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <MainLayout>
          <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/features" element={<Features />} />
          <Route path="/components" element={<Components />} />
          <Route path="/layout" element={<Dashboard />} />
          </Routes>
        </MainLayout>
      </ThemeProvider>
    </Router>
  );
}

export default App;
