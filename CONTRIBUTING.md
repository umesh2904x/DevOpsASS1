# Contributing to ShopVerse

Thanks for helping out. This repo follows the conventions below — sticking to them keeps the
CI pipeline green and avoids rework in review.

## Getting set up

```bash
git clone https://github.com/umesh2904x/DevOpsASS1.git
cd DevOpsASS1
npm install
npm run verify      # lint + test + build, same gate CI runs
```

## Branch naming

| Prefix | Use it for | Merges into |
| --- | --- | --- |
| `feature/<short-description>` | New user-visible capability | `develop` |
| `fix/<short-description>` | Bug fix | `develop` |
| `hotfix/<short-description>` | Production-only fix | `main` **and** `develop` |
| `docs/<short-description>` | Documentation only | `develop` |

Never commit directly to `main`.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short imperative summary>
```

Allowed types: `feat`, `fix`, `test`, `docs`, `ci`, `build`, `chore`, `refactor`, `perf`.

```
feat(cart): apply coupon codes at checkout
fix(orders): reject payment when stock changed
test(cart): cover quantity cap validation
docs(readme): document the API reference
ci: cache npm dependencies between runs
```

Subject line: imperative mood, ≤ 72 characters, no trailing full stop.

## Pull requests

1. Branch off `develop`, not `main`.
2. Keep the change focused — one topic per PR.
3. Fill in the PR template: what changed, why, how you tested it.
4. Request at least one review. The PR cannot merge until CI is green and one approval lands.
5. Squash-merge into `develop` using a conventional commit title.
6. Delete your branch after merging.

## Code standards

- Run `npm run lint` before pushing; ESLint must report zero problems.
- Add or update tests for any behaviour change — the suite must pass.
- Never commit `node_modules/`, `.env`, secrets or build output (`dist/`, `coverage/`).
- Keep business rules in `server/src/services/`, HTTP concerns in `server/src/app.js`.

## Reporting bugs

Open an issue with the bug report template: steps to reproduce, expected vs actual behaviour,
your Node version, and the relevant CI log if it only fails on the pipeline.
