import { Link } from "react-router-dom"

export function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Welcome to Docs</h1>
      <p className="mb-8">Select a language to start.</p>
      <div className="space-x-4">
        <Link to="/en" className="text-blue-500 hover:underline">
          English
        </Link>
        <Link to="/zh-cn" className="text-blue-500 hover:underline">
          简体中文
        </Link>
      </div>
    </div>
  )
}
