import React from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'
import App from './App'
import { ThemeProvider } from './components/theme-provider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" attribute="class">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
