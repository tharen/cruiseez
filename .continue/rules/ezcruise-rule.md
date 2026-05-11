---
name: ezcruise rule
---

# Project Architecture

This is a Vue 3 application using typescript.
The app is being designed to work offline as a PWA.
The main purpose of the app is to collect field data related
to forest inventory. Currently, data is stored locally
without syncronizing to a backend API. The app will support
importing and exporting data using JSON files that are manually 
distributed to field workers.

## Version 3
- Root folder '/ezcruise'
- Components in './src/components'
- Views in './src/views'
- Database logic in './src/db.ts'
- PWA service worker in './public/sw.ts
- CSS styles in './src/styles.css'
- Main app located in './index.html'; './src/App.vue'; './src/main.ts'
