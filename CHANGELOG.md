# Changelog

All notable changes to ShopVerse are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Entries map directly onto the
[Conventional Commit](https://www.conventionalcommits.org/) history in this repository.

## [1.0.0] - 2026-02-14

Release cut from `develop` into `main` by the CD pipeline.

### Added
- Product catalogue API with category, text-search and max-price filters, plus a categories endpoint.
- Session-scoped cart with stock validation, a 10-unit-per-line cap, and live pricing
  (subtotal, shipping, 5% tax, 10% discount above ₹4,999).
- Order placement for COD and card payments, with validation and an order status workflow.
- Shipment tracking service and `GET`/`POST /api/orders/:id/tracking` endpoints; a timeline is
  created automatically at checkout.
- Responsive storefront that browses the catalogue, manages the cart and places COD orders.
- API test suite (16 tests) covering catalogue, cart, order and tracking flows.
- ESLint configuration, build manifest and packaging scripts for the pipeline.
- Two-stage, non-root Docker image with a health check.
- GitHub Actions CI pipeline: lint, test on Node 20 + 22, build, package, smoke test, image build.
- GitHub Actions CD pipeline: CI status gate, GHCR publish, staging rollout with health probe,
  and release artefacts.
- Contributing guide, pull request template, branch strategy and CI/CD documentation.

### Changed
- Base shipping charge reduced to ₹49 for orders under the ₹999 free-shipping threshold
  (`PROJ-33`); threshold and charge extracted into named constants (`PROJ-31`).
- CI caches npm dependencies and cancels superseded runs on the same ref.

### Fixed
- Cart and order routes now forward service-layer errors to the Express error handler instead of
  returning `500`, so validation failures surface their real status codes.
- `getCart` is exported from the cart service so route handlers can summarise a session cart.

[1.0.0]: https://github.com/umesh2904x/DevOpsASS1/releases/tag/v1.0.0
