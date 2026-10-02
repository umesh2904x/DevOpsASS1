# ShopVerse — E-Commerce Storefront

DevOps Assignment 1 (application) with Assignment 2 (Git + GitHub source-code management) and
Assignment 3 (CI/CD with GitHub Actions) applied on top of it.

[![CI](https://github.com/umesh2904x/DevOpsASS1/actions/workflows/ci.yml/badge.svg)](https://github.com/umesh2904x/DevOpsASS1/actions/workflows/ci.yml)
[![CD](https://github.com/umesh2904x/DevOpsASS1/actions/workflows/cd.yml/badge.svg)](https://github.com/umesh2904x/DevOpsASS1/actions/workflows/cd.yml)
[![Node](https://img.shields.io/badge/node-20-green)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## What it does

A small storefront with a REST backend:

- browse and filter the product catalogue (category, text search, max price)
- add / remove cart lines with stock and quantity validation
- live pricing — subtotal, shipping, 5% tax, 10% discount above ₹4,999
- place a COD or card order; the cart is emptied on success

## Tech stack

| Layer | Choice |
| --- | --- |
| Runtime | Node.js 20+ |
| Server | Express 4 (REST API + static hosting) |
| Store | In-memory repository (`server/src/data`, `services`) |
| Tests | `node:test` + Supertest (14 assertions suites) |
| Quality | ESLint 8 (`eslint:recommended`) |
| Packaging | npm scripts → `dist/build-manifest.json`, `dist/shopverse-<version>.tgz` |
| Container | Dockerfile (2-stage, non-root user, healthcheck) |
| CI/CD | GitHub Actions (`.github/workflows/ci.yml`, `cd.yml`) |

## Getting started

```bash
npm install
npm start          # http://localhost:3000
npm run dev        # same, with nodemon reload
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Run the server |
| `npm run lint` | ESLint over `server/` and `public/` |
| `npm test` | Unit + API test suite |
| `npm run test:coverage` | Same, with c8 coverage report |
| `npm run build` | Emit `dist/build-manifest.json` |
| `npm run package` | Build + tarball into `dist/` |
| `npm run verify` | lint → test → build (the same gate CI runs) |
| `npm run docker:build` / `docker:run` | Build and run the container |

## API reference

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness probe used by Docker and CD |
| GET | `/api/products` | Catalogue; accepts `?category=&search=&maxPrice=` |
| GET | `/api/products/categories` | Distinct category list |
| GET | `/api/products/:id` | Single product |
| GET | `/api/cart` | Current cart with pricing breakdown |
| POST | `/api/cart/items` | Add `{ productId, qty }` |
| DELETE | `/api/cart/items/:productId` | Remove a line |
| DELETE | `/api/cart` | Empty the cart |
| POST | `/api/orders` | Place an order |
| GET | `/api/orders` | All orders |
| GET | `/api/orders/:id` | One order |

Cart and order endpoints are session-scoped through the `x-session-id` header.

Errors are returned as `{ "error": "<CODE>", "message": "<reason>" }` with codes
`PRODUCT_NOT_FOUND`, `INVALID_QUANTITY`, `MAX_QUTY_EXCEEDED`, `INSUFFICIENT_STOCK`,
`ITEM_NOT_FOUND`, `VALIDATION_ERROR`, `EMPTY_CART`, `NOT_FOUND`, `INTERNAL_ERROR`.

## Assignment 2 — source-code management

- **Branch strategy:** `main` (release-ready) ← `develop` (integration) ← `feature/*`, `fix/*`
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `test:`, `docs:`, `ci:`, `chore:`
- **Merges:** squash for feature branches, `--no-ff` merge commit for releases, tags per release
- **Collaboration:** pull requests, code review, `CONTRIBUTING.md`, `PULL_REQUEST_TEMPLATE.md`
- **Details:** [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md) · [`CHANGELOG.md`](CHANGELOG.md)

## Assignment 3 — CI/CD

`.github/workflows/ci.yml` runs on every push and pull request:

1. checkout → 2. install with `npm ci` → 3. **lint** → 4. **test** (coverage uploaded)
→ 5. **build** → 6. **package** → 7. upload build manifest + tarball as artefacts
→ 8. `smoke test` boots the built app and hits `/api/health`

`.github/workflows/cd.yml` runs on push to `main`:

1. verify CI status → 2. build multi-stage Docker image → 3. smoke test the image
→ 4. push image to GitHub Container Registry → 5. publish release artefacts
→ 6. deploy to staging and run a post-deploy health probe

Details: [`docs/CI_CD_PIPELINE.md`](docs/CI_CD_PIPELINE.md)

## Repository layout

```
server/src/app.js            Express app factory (routes, middleware)
server/src/server.js         Entry point
server/src/data/products.js  Seed catalogue
server/src/services/         cartService.js, orderService.js (business rules)
server/tests/api.test.js     API test suite
public/                      Storefront (index.html, css, js)
scripts/                     build.js, package.js
.github/workflows/           ci.yml, cd.yml
docs/                        GIT_WORKFLOW.md, CI_CD_PIPELINE.md
```
