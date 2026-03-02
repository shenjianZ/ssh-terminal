# Configuration File (`site.yaml`) Explained

The project is configuration-driven. Most behavior is defined in `public/config/site.yaml`. This page documents every field using concise tables.

## Top-level keys
| Key | Purpose |
| :-- | :-- |
| `site` | Global metadata like title, description, logo, author |
| `navbar` | Top navigation bar (logo/title toggles, items, actions) |
| `sidebar` | Left navigation tree (collections/sections/children) |
| `theme` | Theme options (default mode, toggle) |
| `toc` | Article table of contents (enabled, levels, title) |
| `footer` | Footer links, socials, repository meta |
| `pwa` | Progressive Web App settings (reserved/optional) |

---

## `site`
| Field | Type | Description | Example |
| :-- | :-- | :-- | :-- |
| `title` | string | Site title | `"React Docs UI Example"` |
| `description` | string | Short site description (SEO) | `"Beautiful docs made simple"` |
| `logo` | string or object | Logo to display. String can be emoji or image path. Object allows light/dark images. | `"📚"`, `"/images/logo.png"`, or `{ light: "/images/favicon.svg", dark: "/images/favicon-dark.svg" }` |
| `author` | string | Site author/organization | `"React Docs UI Team"` |

Logo formats supported:
- Emoji: `"🚀"`
- URL or public path: `"/images/logo.png"`
- Light/Dark object: `{ light, dark }`

---

## `navbar`
| Field | Type | Description |
| :-- | :-- | :-- |
| `showLogo` | boolean | Show logo at top-left |
| `showTitle` | boolean | Show site title in navbar |
| `showLanguageSwitcher` | boolean | Show language switcher |
| `items` | array<Item> | Primary navigation links |
| `actions` | array<Action> | Right-side action buttons (e.g. GitHub) |

Item
| Field | Type | Description | Example |
| :-- | :-- | :-- | :-- |
| `title` | string | Link text | `"Guide"` |
| `link` | string | Path or URL. Internal paths start with `/`. | `"/guide"` |
| `external` | boolean (optional) | Open in new tab if true |
| `visible` | boolean (optional) | Conditionally hide/show |

Action
| Field | Type | Description | Example |
| :-- | :-- | :-- | :-- |
| `type` | `"github"` or `"custom"` (optional) | Predefined or custom action | `"github"` |
| `title` | string (optional) | Button text when `type` is `custom` |
| `link` | string | Destination URL |
| `icon` | string (optional) | Icon name for custom action |
| `enabled` | boolean (optional) | Toggle the action |

---

## `sidebar`
| Field | Type | Description |
| :-- | :-- | :-- |
| `enabled` | boolean (optional) | Global toggle for sidebar |
| `collections` | record<string, Collection> | Map of top-level sections (e.g. `guide`) |
| `sections` | Section[] (legacy, optional) | Backward-compatible single-tree definition |

Collection
| Field | Type | Description |
| :-- | :-- | :-- |
| `sections` | Section[] | Grouped side-nav sections |

Section
| Field | Type | Description | Example |
| :-- | :-- | :-- | :-- |
| `title` | string | Section title | `"Getting Started"` |
| `path` | string | Base path that expands/highlights this section | `"/guide"` |
| `children` | Child[] (optional) | Leaf links under the section |

Child
| Field | Type | Description | Example |
| :-- | :-- | :-- | :-- |
| `title` | string | Link text | `"Introduction"` |
| `path` | string | Full page path | `"/guide/introduction"` |

---

## `theme`
| Field | Type | Description | Options | Default |
| :-- | :-- | :-- | :-- | :-- |
| `defaultMode` | string | Default color mode | `light`, `dark`, `auto` | `auto` |
| `allowToggle` | boolean | Allow user theme switching | `true`/`false` | `true` |

---

## `toc`
| Field | Type | Description | Example |
| :-- | :-- | :-- | :-- |
| `enabled` | boolean | Enable page table of contents | `true` |
| `maxLevel` | number (1-6) | Max heading depth to show | `3` |
| `title` | string | TOC panel title | `"On This Page"` |

Note: Per-page TOC visibility/anchors are also affected by page frontmatter.

---

## `footer`
| Field | Type | Description |
| :-- | :-- | :-- |
| `enabled` | boolean | Show footer |
| `copyright` | string | Copyright text |
| `repository` | Repository (optional) | Repo info used for links like “Edit this page” |
| `lastUpdated` | string (optional) | Site/content last update date |
| `links` | Link[] (optional) | Footer link columns |
| `social` | Social[] (optional) | Social icon links |

Repository
| Field | Type | Description | Example |
| :-- | :-- | :-- | :-- |
| `url` | string | Repository URL | `"https://github.com/user/repo"` |
| `branch` | string | Docs branch | `"main"` |

Link
| Field | Type | Description |
| :-- | :-- | :-- |
| `title` | string | Link title |
| `link` | string | Path or URL |
| `external` | boolean (optional) | Open in new tab |

Social
| Field | Type | Description |
| :-- | :-- | :-- |
| `name` | string | Provider key (e.g. `github`, `twitter`, `bilibili`) |
| `url` | string | Profile or link URL |
| `icon` | string | Icon name |

---

## `pwa` (optional)
| Field | Type | Description |
| :-- | :-- | :-- |
| `enabled` | boolean | Enable PWA features (reserved) |
| `name` | string | App name |
| `shortName` | string | Short app name |
| `description` | string | App description |
| `themeColor` | string | Theme color |
| `backgroundColor` | string | Background color |

---
