# Dependency Registry & Justifications

Every dependency used in Pratikar is pinned to an exact version, audited for open-source license compliance (MIT, Apache 2.0, or BSD), and strictly justified below.

## Production Dependencies (Zero runtime network calls)

- **`react` (18.3.1)**: Core declarative UI library for rendering component trees and managing client-side state.
- **`react-dom` (18.3.1)**: React renderer for browser DOM interaction.
- **`react-router-dom` (6.29.0)**: Client-side routing with `HashRouter` to enable static hosting on GitHub Pages, Vercel, and Cloudflare Pages without server-side rewrite dependencies.
- **`idb` (8.0.2)**: Lightweight, promise-based wrapper (~1.2KB) over the browser's native IndexedDB API for offline encrypted storage.
- **`lucide-react` (0.475.0)**: Modern, accessible SVG icon set, tree-shaken by Vite so only referenced icons are bundled.
- **`@fontsource-variable/noto-sans` (5.1.1)**: Self-hosted variable Latin font files; avoids third-party Google Fonts CDN requests.
- **`@fontsource-variable/noto-sans-devanagari` (5.1.1)**: Self-hosted variable Devanagari font files for authentic Hindi and Marathi rendering.

## Developer & Build Tooling Dependencies

- **`vite` (5.4.14)**: Next-generation fast frontend build tool and development server.
- **`@vitejs/plugin-react` (4.3.4)**: Vite plugin providing fast refresh and Babel/SWC transforms for React.
- **`vite-plugin-pwa` (0.21.1)**: Progressive Web App generator utilizing Workbox for offline asset precaching.
- **`typescript` (5.7.3)**: Strict static type checking to eliminate runtime errors (`noUncheckedIndexedAccess: true`).
- **`@types/react` (18.3.18)**: TypeScript type definitions for React.
- **`@types/react-dom` (18.3.5)**: TypeScript type definitions for ReactDOM.
- **`@types/node` (22.13.4)**: Node.js runtime type definitions for build scripts.
- **`tailwindcss` (3.4.17)**: Utility-first CSS framework for custom styling with purged production stylesheets.
- **`postcss` (8.5.2)**: CSS transformation pipeline for Tailwind CSS.
- **`autoprefixer` (10.4.20)**: PostCSS plugin adding browser vendor prefixes automatically.
- **`ajv` (8.17.1)**: High-performance JSON Schema validator used during build to guarantee configuration integrity.
- **`vitest` (2.1.8)**: Fast Vite-native unit testing runner.
- **`@testing-library/react` (16.2.0)**: Simple and complete React DOM testing utilities focused on user interactions.
- **`@testing-library/jest-dom` (6.6.3)**: Custom Jest/Vitest matchers for asserting on the state of the DOM.
- **`@testing-library/user-event` (14.6.1)**: Simulation of native browser user interactions for tests.
- **`jsdom` (26.0.0)**: Pure JavaScript implementation of WHATWG DOM and HTML standards for testing.
- **`eslint` (8.57.1)**: JavaScript/TypeScript linter enforcing clean code standards.
- **`@typescript-eslint/parser` (8.24.0)**: ESLint parser enabling linting of TypeScript source code.
- **`@typescript-eslint/eslint-plugin` (8.24.0)**: ESLint rules for TypeScript codebases.
- **`eslint-plugin-react` (7.37.4)**: React-specific linting rules.
- **`eslint-plugin-react-hooks` (5.1.0)**: Rules of Hooks enforcement for React.
- **`eslint-plugin-jsx-a11y` (6.10.2)**: Static accessibility checker for JSX elements to guarantee WCAG compliance.
- **`prettier` (3.5.1)**: Opinionated code formatter ensuring consistent formatting.
- **`@playwright/test` (1.50.1)**: Modern end-to-end browser testing framework.
- **`@axe-core/playwright` (4.10.1)**: Automated accessibility testing engine integrating Axe with Playwright.
