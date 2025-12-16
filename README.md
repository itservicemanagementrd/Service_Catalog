# ITSM Service Catalog Manager

A serverless, browser-based IT Service Management tool designed to manage IT services, CIs, requests, and support information using ITIL best practices.

[![Build and deploy](https://github.com/itservicemanagementrd/Service_Catalog/actions/workflows/deploy.yml/badge.svg)](https://github.com/itservicemanagementrd/Service_Catalog/actions/workflows/deploy.yml) [![GitHub Pages](https://img.shields.io/badge/site-github--pages-blue)](https://itservicemanagementrd.github.io/Service_Catalog/)


![Application Preview](https://via.placeholder.com/800x400?text=ITSM+Service+Catalog+Preview)

## Features

- **Zero Database**: Uses `localStorage` for automatic data persistence.
- **ITIL Aligned**:
  - **Business View**: Manage Services (SLAs, Owners, Costs).
  - **Components (CIs)**: Manage Infrastructure (Servers, Apps, DBs).
  - **Request Catalog**: Define standard requests (Access, Service, Info).
  - **Technical View**: Support routing and knowledge management.
- **Maintenance / Settings**: Configurable lookups for Status, Criticality, Contacts, etc.
- **Data Management**:
  - Auto-save on every change.
  - JSON Export/Import for backup.
  - Soft Delete (Inactivate) workflow.

## Running Locally

Since this is a static site using ES6 modules (if extended) or simple JS, you can run it via any static file server.

### Prerequisites
- Node.js (optional, for running `http-server`)
- Any modern web browser

### Start
```bash
npx http-server . -p 8080
```
Then open `http://localhost:8080`.

## Architecture
- `index.html`: Structure (Sidebar, Modal, Grid).
- `style.css`: Theme (Dark/Professional) and responsive layout.
- `app.js`: Core logic for State Management (Store), UI Rendering, and Events.

## License
MIT
