# CI/CD Pipeline (Assignment 3)

Tooling: **GitHub Actions** — no extra server to host, the runners and the logs already live
next to the code in the same repository.

| File | Trigger | Job |
| --- | --- | --- |
| `.github/workflows/ci.yml` | every push, every PR to `main`/`develop`, manual | CI — lint, test, build, package, smoke test, container build |
| `.github/workflows/cd.yml` | push to `main`, manual | CD — gate on CI, publish image, deploy staging, cut a release |

---

## 1. Continuous Integration

```
push / pull_request
      │
      ├── job: lint ──────────────┐
      │    eslint server public   │
      │                           │
      ├── job: test ──────────────┤  matrix: Node 20.x + 22.x
      │    npm run test:coverage  │  coverage uploaded as an artefact
      │                           │
      └── job: build ◄────────────┘  needs: [lint, test]
           npm ci → build → package → upload dist/ → boot app → GET /api/health
                │
                └── job: docker ◄── needs: build
                     docker build (BuildKit, gha cache, not pushed on PRs)
                          │
                          └── job: ci-summary → written to the run summary page
```

### Stages in detail

| # | Stage | Command | Fails when |
| --- | --- | --- | --- |
| 1 | Checkout | `actions/checkout@v4` | source unavailable |
| 2 | Install | `npm ci` (lockfile-exact, cached) | lockfile out of sync |
| 3 | **Lint** | `npm run lint` | ESLint errors, code style broken |
| 4 | **Test** | `npm run test:coverage` | any assertion fails, on either Node version |
| 5 | **Build** | `npm run build` | build script cannot emit `dist/build-manifest.json` |
| 6 | **Package** | `npm run package` | tarball creation fails |
| 7 | Artefacts | `actions/upload-artifact@v4` | — (downloadable from the run page) |
| 8 | Smoke test | boot + `GET /api/health` | app never becomes healthy |
| 9 | Container | `docker/build-push-action@v6` | Dockerfile breaks |

Test, build and Docker jobs are gated on `needs:`, so a lint failure stops the pipeline
immediately instead of wasting runner minutes.

### Quality gates

- **Node version matrix** catches an API used only in one runtime.
- **Coverage report** is attached to every run for the primary version.
- **Smoke test after build** catches packaging mistakes that unit tests miss.
- **`concurrency`** cancels superseded runs on the same ref, saving quota.
- **`ci-summary`** writes pass/fail per job into the run summary — useful evidence in a report.

---

## 2. Continuous Delivery

```
push to main
      │
      ├── job: verify ────────── uses actions/github-script to assert every CI check on
      │                         this SHA concluded "success"  (no red build reaches prod)
      │
      ├── job: image ─────────── buildx multi-stage build → login to GHCR → push tags
      │                         (sha, main, semver, latest)
      │
      ├── job: deploy-staging ── environment: staging
      │    pull image → docker run → poll /api/health (20 × 2s)
      │    → exercise GET /api/products and POST /api/cart/items
      │    → tear the container down
      │
      ├── job: release ───────── npm run package → upload tarball
      │                         → softprops/action-gh-release creates/updates v1.0.0
      │
      └── job: deploy-production  runs only if repository secret DEPLOY_HOOK_URL is set
                                 POSTs the provider's deploy hook (Render/Railway/VPS)
```

### Why the deploy is written this way

- **Gate before deploy.** `verify` reads the CI checks through the API, so a failing or missing
  CI run stops the release instead of shipping a broken build.
- **Immutable artefact.** The image tagged `sha-<short>` is what staging runs, and it is the
  same artefact production receives — build once, promote later.
- **Health-gated rollout.** The post-deploy probe is what decides success; a container that
  boots but does not answer `/api/health` is treated as a failed deployment.
- **Environment protection.** `staging` and `production` are GitHub Environments, so approvals
  and environment secrets stay separate from source secrets.
- **Cleanup is `if: always()`** so a failed probe does not leak a container on the runner.

### Environment setup (one time, in GitHub UI)

| Setting | Where | Value |
| --- | --- | --- |
| Repository → Actions → General → Workflow permissions | repo settings | Read & write |
| Packages | repo settings | allow GitHub Actions to publish |
| Environment `staging` | Environments | no secrets required |
| Secret `DEPLOY_HOOK_URL` | Environments → production | provider deploy hook, optional |
| Branch protection on `main` | Branches | require CI checks + 1 review |

`GITHUB_TOKEN` is provided automatically and is already granted `packages: write` by the
workflow, so GHCR push works with no manual secret.

---

## 3. End-to-end demonstration

```bash
git switch -c feature/order-tracking
# ...edit code...
git commit -am "feat(orders): add order status tracking"
git push -u origin feature/order-tracking
```

Open a pull request → `ci.yml` runs lint → test → build → package → smoke test → docker →
the PR shows all checks green and the run summary lists each stage. After review, squash-merge
into `develop`. When the release is ready, merge `develop` into `main` → `cd.yml` verifies CI,
publishes `ghcr.io/umesh2904x/devopsass1:latest`, deploys it to staging, health-probes it and
publishes release artefacts.

---

## 4. Local reproduction of the pipeline

The same gates run on a laptop:

```bash
npm ci
npm run verify     # lint → test → build, identical to CI
npm run docker:build && npm run docker:run
```

To rehearse a CI failure, introduce a lint error and run `npm run lint` — it exits non-zero
exactly as the `lint` job does.

## 5. Badges

The two badges at the top of `README.md` track the real workflow runs. If a badge shows
"failing", open the workflow from the badge and read the job summary to see which stage broke.
