# Quick Start

This guide will walk you through creating, configuring, and running your own React documentation website from scratch in 5 minutes.

## 1. Create the Project

Using the official scaffolding tool is the most efficient way. Open your terminal and run the following command:

```bash
# This creates a project named "my-awesome-docs"
npx create-react-docs-ui@latest my-awesome-docs
```

Next, enter the project directory and install the dependencies:

```bash
cd my-awesome-docs
npm install
```

## 2. Organize Your Documents

All your documentation content is stored as Markdown files in the `public/docs/` directory.

- Open the `public/docs/en/` directory.
- You can modify the existing `index.md` and files under the `guide` directory, or create new `.md` files.

For example, let's create a new page. Create a new file named `about.md` in `public/docs/en/`:

```markdown
---
title: About Us
description: This is a page about our team.
---

# About Us

We love open source and creation!
```


## 3. Configure the Website

Now, let's display the newly created page by modifying the configuration file.

Open the core configuration file `public/config/site.yaml`.

### a. Modify Site Information

Update the `site` section to give your website a new title and logo.

```yaml
site:
  title: "My Awesome Docs"
  description: "A website built with React Docs UI"
  logo: "🚀" # You can use an emoji or an image path
```

### b. Add to the Navbar

In the `navbar.items` array, add a link for the "About" page. Remember to update the links for the English version.

```yaml
navbar:
  items:
    - title: "Home"
      link: "/en/"
    - title: "Guide"
      link: "/en/guide/introduction"
    - title: "About"  # New
      link: "/en/about" # New
```

### c. Add to the Sidebar

To make the "About" page visible in the sidebar, we'll add a new entry in `sidebar.collections.guide.sections`. Make sure to use English paths.

```yaml
sidebar:
  collections:
    guide:
      sections:
        - title: "Getting Started"
          path: "/en/guide"
          children:
            - title: "Introduction"
              path: "/en/guide/introduction"
            - title: "Installation"
              path: "/en/guide/installation"
            - title: "Quick Start"
              path: "/en/guide/quick-start"
        # You can create a new section for the "About" page
        - title: "About Us"
          path: "/en/about"
          children:
            - title: "About"
              path: "/en/about"
```

## 4. Launch the Website

Save all your changes and run the following command in your terminal:

```bash
npm run dev
```

Your website should now be running at `http://localhost:5173`. Visit it, and you will see the updated title, logo, and the new "About" link in the navbar and sidebar. Congratulations, you have successfully mastered the basic workflow of React Docs UI!