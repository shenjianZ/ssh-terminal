# Installation

## Prerequisites

Before you begin, make sure your development environment meets the following requirements:

- **Node.js**: Version `>= 18.0.0`
- **Package Manager**: `npm`, `yarn`, or `pnpm`

## Recommended Method: Use the Scaffolding Tool

We strongly recommend using the official `create-react-docs-ui` scaffolding tool to create your new documentation project. This is the fastest and easiest way to ensure all configurations are set up correctly.

1.  **Run the creation command**:
    ```bash
    npx create-react-docs-ui@latest my-docs
    ```
    This will create a new folder named `my-docs` in the current directory.

2.  **Enter the project and install dependencies**:
    ```bash
    cd my-docs
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npm run dev
    ```
    Your documentation website is now running at `http://localhost:5173` (or another available port).

## Manual Installation (for existing projects)

If you want to manually integrate `react-docs-ui` into an existing Vite + React project, follow these steps:

1.  **Install the core library**:
    ```bash
    npm install react-docs-ui
    ```

2.  **Create configuration files**:
    In your `public` directory, create a `config` folder, and inside it, create a `site.yaml` file. You can copy a basic template from [here](https://github.com/shenjianZ/react-docs-ui/blob/main/react-docs-ui/public/config/site.yaml).

3.  **Create the documentation directory**:
    In your `public` directory, create a `docs` folder to store your Markdown files. For example: `public/docs/en/index.md`.

4.  **Modify the application entry file**:
    Update your `src/main.tsx` (or `main.jsx`) file to render the `DocsApp` component to initialize the application.

    ```tsx
    // src/main.tsx
    import React from 'react'
    import ReactDOM from 'react-dom/client'
    import { DocsApp } from 'react-docs-ui'
    import 'react-docs-ui/dist/style.css' // Import core styles

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <DocsApp />
      </React.StrictMode>,
    )
    ```
5.  **Ensure your `index.html` contains `<div id="root"></div>`**