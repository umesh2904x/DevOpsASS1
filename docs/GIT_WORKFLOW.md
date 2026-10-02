# Git Workflow (Assignment 2)

## 1. Repository purpose

One Git repository, `ShopVerse`, hosted on GitHub at
<https://github.com/umesh2904x/DevOpsASS1>. It carries the Assignment 1 application plus the
branching, commit and review practices that Assignment 2 asks for, and the GitHub Actions
pipelines from Assignment 3.

## 2. Branching strategy

A **Git Flow**-style model trimmed to what a small team needs:

```
main      ────●───────────────────────●──────────►  release-ready, tagged
             ↑\                       ↑/
develop   ───●─●───●───●───────────────●─────────►  integration branch
             ↑\   ↑\  ↑                ↑/
feature/*  ───●─●──●─●────────────────●─────────►  short-lived work
hotfix/*       └──────────●───────────┘           main + develop
```

| Branch | Purpose | Merge target | Protection |
| --- | --- | --- | --- |
| `main` | Deployed code, always releasable | — | No direct push, review + CI required |
| `develop` | Daily integration, shared staging | `main` via PR | Review required |
| `feature/<desc>` | One Jira story per branch | `develop` | Squash merge |
| `fix/<desc>` | Defect from staging | `develop` | Squash merge |
| `hotfix/<desc>` | Production defect | `main` **and** `develop` | Fast, CI still enforced |

Naming is always `type/short-kebab-description`, e.g. `feature/order-tracking`.

## 3. Commit management

### Conventional Commits

```
<type>(<scope>): <imperative summary>
```

Types used in this repo: `feat`, `fix`, `test`, `docs`, `ci`, `build`, `chore`, `refactor`.

```
feat(cart): apply coupon codes at checkout
fix(orders): reject payment when stock changed
test(cart): cover quantity cap validation
ci: cache npm dependencies between runs
```

Rules that were applied consistently:

- subject in the imperative mood, ≤ 72 characters, no full stop
- one logical change per commit — a commit must build and its tests must pass
- body explains *why*, not *what*, when the reason is not obvious
- `BREAKING CHANGE:` footer for anything that breaks the API contract
- generated files (`dist/`, `coverage/`, `node_modules/`) are never committed

### Why this matters here

`CHANGELOG.md` is generated in the same shape as the commit log, so the release notes for
`v1.0.0` map directly onto the commit history. It also lets the CD pipeline describe a build
by its commit subject.

### Reverting safely

```bash
git revert <sha>          # safe: adds a new commit instead of rewriting history
git tag -a v1.0.1 -m "revert: cart stock validation" <sha>
```

History on `main` is never rewritten — no force pushes.

## 4. Merging

| Situation | Command used | Why |
| --- | --- | --- |
| Feature finished | PR → `develop`, **Squash and merge** | Keeps `develop` history readable; one commit per story |
| Release | PR → `main`, **Merge commit** (`--no-ff`) | Records *when* the release was cut and from which commit |
| Conflict | resolve by hand, `git add`, then commit | Never `ours`/`theirs` blindly — a conflict is a design decision |
| Reverting | `git revert` | Preserves the audit trail |

Merge conflicts were resolved deliberately during development. One occurred when the
`feature/order-tracking` branch and `develop` both changed the default shipping charge in
`cartService.summarise()`: the feature raised it for small orders, `develop` had introduced a
free-shipping threshold. The resolution kept both intents — threshold logic from `develop`,
the higher base charge from the feature — with a regression test added.

## 5. Collaboration with the team

### Working together on GitHub

1. **Issue first.** Every story from the Jira backlog gets a GitHub issue, referenced from the
   branch name and commit footers (`PROJ-14`).
2. **Branch off `develop`**, push with `git push -u origin feature/<desc>`.
3. **Open a pull request** using `.github/PULL_REQUEST_TEMPLATE.md`.
4. **Review:** at least one approval and CI green before merge. Reviewers comment on specific
   lines rather than approving blind; authors resolve and push follow-up commits.
5. **Merge** by squash, then delete the branch.
6. **Sync** local: `git checkout develop && git pull --rebase`.

### Branch protection rules to enable on GitHub

Under *Settings → Branches → Add rule*:

- `main`: require a pull request (1 approval), require status checks
  (`Lint`, `Test`, `Build & Package`, `CI Summary`), require branches to be up to date,
  block force pushes and deletions.
- `develop`: require a pull request (1 approval), require the same status checks.

### Team members

| Member | Role | Owns | Commits appear as |
| --- | --- | --- | --- |
| Umesh (repo owner) | DevOps / release | Branching, CI/CD pipelines, releases | `Umesh2904x` |
| Rahul (teammate) | Backend | Cart service, order tracking, search API | `rahul-dev` |
| Priya (teammate) | Frontend + QA | Storefront UI, coupon flow, test coverage | `priya-dev` |

A team simulation is recorded in this repository so the workflow can be demonstrated without
depending on live collaborators: each teammate's work lives on its own branch with its own
commits and author identity, merged into `develop` through pull-request-equivalent merges.
Replace these with real PRs from your actual teammates when they are added as collaborators.

### Resolving conflicts as a team

```bash
git fetch origin
git checkout feature/order-tracking
git rebase origin/develop        # or: git merge origin/develop
# resolve each conflict, then:
git add <files>
git rebase --continue
```

If the same conflict recurs, the two branches have diverged in intent — talk it through in the
PR thread instead of re-running the merge.

## 6. Commands used, end to end

```bash
git clone https://github.com/umesh2904x/DevOpsASS1.git
git init -b main                      # first time only
git add .
git commit -m "chore: bootstrap project scaffolding"
git switch -c develop
git switch -c feature/cart-coupons
git commit -am "feat(cart): apply coupon codes at checkout"
git push -u origin feature/cart-coupons
git switch develop && git merge --squash feature/cart-coupons
git commit -m "feat(cart): coupon codes at checkout (PROJ-21)"
git switch main && git merge --no-ff develop -m "chore(release): v1.0.0"
git tag -a v1.0.0 -m "ShopVerse 1.0.0"
git push origin main --follow-tags
```
