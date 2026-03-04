import React from "react";
import ReactDOM from "react-dom/client";

import "react-docs-ui/dist/react-docs-ui.css";
import { DocsApp } from "react-docs-ui";
// import "../../../react-docs-ui/dist/react-docs-ui.css";
// @ts-ignore using local built ES module for development
// import { DocsApp } from "../../../react-docs-ui/dist/react-docs-ui.es.js";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <DocsApp />
    </React.StrictMode>,
);
