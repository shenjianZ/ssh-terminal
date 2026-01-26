import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeGlobalKeyHandler } from "@/lib/globalKeyHandler";

// 初始化全局快捷键处理器
initializeGlobalKeyHandler();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
