# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a **monorepo of technology stack demos and experiments** ("各种技术栈demo杂烩"). Each subdirectory is an independent project with its own dependencies and build system — there is no shared monorepo tooling (no workspaces, no turborepo, no lerna).

## Project inventory

| Directory | Stack | Key notes |
|---|---|---|
| `claude-ui-test/` | React 18 + Vite 5 + Tailwind CSS 3 + TypeScript | BOM备料 UI replica from Figma layer data |
| `nextdemo/` | Next.js 14 (App Router) + Tailwind + TypeScript | `@` path alias configured in webpack; bundle analyzer scripts available |
| `nuxt3.2/` | Nuxt 3 + Vue 3 | Minimal starter |
| `nuxtDemo/` | Nuxt (multiple versions) | Contains `blog/`, `demo2/`, `nuxtdemo2024/` |
| `vue3.0/eleme/` | Vue 3 + Vite 2 + Pinia + Vant | Eleme-style mobile app |
| `vue3.0/viteapp/` | Vue 3 + Vite | Basic Vite starter |
| `vue/` | Vue 2 | `d2-admin-elemeManage/`, `eleme/phoneweb/`, `flyapp/` |
| `reactDemo/` | React (various) | Event handling, routing, Redux (thunk/saga), H5 app |
| `vxdemo/` | WeChat mini-program | TDesign retail starter, ESLint + Prettier + commitlint + husky |
| `serve/` | Express + MySQL + multer | File upload server |
| `htmlServe/` | Express | Simple static HTML server |
| `cli/` | Node.js CLI | commander + chalk + download-git-repo |
| `my-electron-app/` | Electron 28 | Basic Electron app |
| `webpack/` | Webpack 5 | Custom loader/plugin demos |
| `rollup/demo/` | Rollup 3 + TypeScript | Build tool demo |
| `uniappdemo/` | uni-app | Mini-program demos |
| `jsdemo/` | Vanilla JS | Canvas, leetcode, algorithms, utils |
| `cssdemo/` | HTML/CSS | Animation and shape demos |
| `html5api/` | HTML5 APIs | Web Workers, Shared Workers |
| `fileabout/` | Binary/image | Image compression, binary format demos |
| `nginx/` | Nginx config | Configuration samples |
| `手撕源码/` | JS/TS | Source code analysis/impl |
| `吸顶/` | CSS | Sticky header demo |

## How to work in this repo

Each project is self-contained. To work on one:

1. `cd <project-directory>`
2. `npm install` (if `node_modules` is missing)
3. Run the dev command for that project (see below for common ones)

### Common dev commands by project type

- **Next.js (`nextdemo/`)**: `npm run dev` → http://localhost:3000
- **Nuxt (`nuxt3.2/`, `nuxtDemo/*/`)**: `npm run dev` → http://localhost:3000
- **Vite (`claude-ui-test/`, `vue3.0/*/`)**: `npm run dev` → http://localhost:5173
- **Express (`serve/`, `htmlServe/`)**: `npm run serve` (nodemon)
- **Electron (`my-electron-app/`)**: `npm start`
- **WeChat mini-program (`vxdemo/`)**: Open in WeChat DevTools, then build npm

### Code style conventions (from vscode settings)

- **2-space indentation** (tabs not used)
- **Single quotes** for JS/TS strings
- **No semicolons** (Prettier)
- **Format on save** with ESLint auto-fix
- Vue files use **Vetur** as default formatter

### Git hooks

The `.husky/` directory exists but appears to have only a placeholder. The `vxdemo/` project has its own husky + commitlint + lint-staged setup.