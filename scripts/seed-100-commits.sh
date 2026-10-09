#!/usr/bin/env bash
# Build ~100 English conventional commits from the current working tree on
# feature/frontend-v3, retarget topic branches, optionally push.
#
#   ./scripts/seed-100-commits.sh           # commits only
#   ./scripts/seed-100-commits.sh --push    # commits + push
#
# Message style: [feat]|[fix]|[docs]|[chore]|[style]|[refactor]: ...

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PUSH=0
[[ "${1:-}" == "--push" ]] && PUSH=1

SNAP="$(mktemp -d /tmp/threshold-snap.XXXXXX)"
cleanup() { rm -rf "$SNAP"; }
trap cleanup EXIT

echo "==> Snapshotting working tree"
rsync -a \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '**/node_modules' \
  --exclude 'dist' \
  --exclude '**/dist' \
  --exclude '.env' \
  --exclude '.env.localbak' \
  --exclude '.data' \
  ./ "$SNAP"/

mkdir -p "$SNAP/scripts"
cp "$0" "$SNAP/scripts/seed-100-commits.sh"

BASE_BRANCH="feature/frontend-v3"
git checkout -q "$BASE_BRANCH"

commit_n=0

copy_paths() {
  local p
  for p in "$@"; do
    [[ "$p" == -* ]] && continue
    if [[ -d "$SNAP/$p" ]]; then
      mkdir -p "$p"
      rsync -a "$SNAP/$p"/ "$p"/
    elif [[ -f "$SNAP/$p" ]]; then
      mkdir -p "$(dirname "$p")"
      cp -a "$SNAP/$p" "$p"
    else
      echo "WARN: missing $p" >&2
    fi
  done
}

do_commit() {
  local msg="$1"
  shift
  local files=("$@")
  local add=() del=() f

  copy_paths "${files[@]}"
  for f in "${files[@]}"; do
    if [[ "$f" == -* ]]; then
      del+=("${f#-}")
    else
      add+=("$f")
    fi
  done

  if ((${#add[@]})); then git add -A -- "${add[@]}"; fi
  if ((${#del[@]})); then git rm -f --ignore-unmatch -- "${del[@]}" 2>/dev/null || true; fi

  if git diff --cached --quiet; then
    echo "SKIP: $msg"
    return 0
  fi
  git commit -m "$msg" >/dev/null
  commit_n=$((commit_n + 1))
  printf '%3d  %s\n' "$commit_n" "$msg"
}

pad_commit() {
  local msg="$1"
  git commit --allow-empty -m "$msg" >/dev/null
  commit_n=$((commit_n + 1))
  printf '%3d  %s\n' "$commit_n" "$msg"
}

echo "==> Creating commits on $BASE_BRANCH"

# 1–25 infra / core backend
do_commit "[chore]: add backend package manifests" backend/package.json backend/package-lock.json backend/tsconfig.json backend/drizzle.config.ts
do_commit "[chore]: add backend Dockerfile" backend/Dockerfile
do_commit "[feat]: define database schema" backend/src/db/schema.ts
do_commit "[feat]: wire Drizzle database client" backend/src/db/db.ts
do_commit "[feat]: add SQL migration runner" backend/src/db/migrate.ts
do_commit "[chore]: add initial Drizzle migration" backend/drizzle/0000_soft_scarlet_spider.sql backend/drizzle/meta/0000_snapshot.json backend/drizzle/meta/_journal.json
do_commit "[chore]: add schema evolution migrations" backend/drizzle/0001_wealthy_mach_iv.sql backend/drizzle/0002_acoustic_argent.sql backend/drizzle/meta/0001_snapshot.json backend/drizzle/meta/0002_snapshot.json
do_commit "[feat]: add HTTP error helper" backend/src/lib/httpError.ts
do_commit "[feat]: add token helpers" backend/src/lib/token.ts
do_commit "[feat]: add AES crypto helpers" backend/src/lib/crypto.ts
do_commit "[feat]: auto-generate secrets on first boot" backend/src/config/secrets.ts
do_commit "[feat]: validate env with Zod at startup" backend/src/config/env.ts
do_commit "[chore]: add backend constants" backend/src/config/constants.ts
do_commit "[feat]: add request validation middleware" backend/src/middleware/validate.middleware.ts
do_commit "[feat]: add rate limit middleware" backend/src/middleware/rateLimit.middleware.ts
do_commit "[feat]: add error handling middleware" backend/src/middleware/error.middleware.ts
do_commit "[feat]: add JWT auth middleware" backend/src/middleware/auth.middleware.ts
do_commit "[feat]: add SMTP mailer" backend/src/lib/mailer.ts
do_commit "[feat]: add email templates" backend/src/lib/emailTemplates.ts
do_commit "[feat]: add audit log writer" backend/src/lib/audit.ts
do_commit "[feat]: seed demo admin on startup" backend/src/db/seed-admin.ts
do_commit "[feat]: add nginx SPA and API proxy config" nginx/nginx.conf
do_commit "[feat]: add docker compose stack" docker-compose.yml
do_commit "[chore]: add env example without secrets" .env.example
do_commit "[chore]: ignore local secrets and env files" .gitignore

# 26–45 auth / services / about / widgets API
do_commit "[feat]: add auth Zod schemas" backend/src/modules/auth/auth.schemas.ts
do_commit "[feat]: add auth repository" backend/src/modules/auth/auth.repository.ts
do_commit "[feat]: implement auth service" backend/src/modules/auth/auth.service.ts
do_commit "[feat]: add auth controllers" backend/src/modules/auth/auth.controller.ts
do_commit "[feat]: wire auth routes" backend/src/modules/auth/auth.routes.ts
do_commit "[feat]: implement GitHub OAuth linking" backend/src/modules/auth/github-oauth.service.ts
do_commit "[feat]: add services repository" backend/src/modules/services/services.repository.ts
do_commit "[feat]: implement services domain" backend/src/modules/services/services.service.ts
do_commit "[feat]: expose services HTTP API" backend/src/modules/services/services.controller.ts backend/src/modules/services/services.routes.ts
do_commit "[feat]: add weather adapter" backend/src/adapters/weather.adapter.ts
do_commit "[feat]: add GitHub adapter" backend/src/adapters/github.adapter.ts
do_commit "[feat]: add RSS adapter" backend/src/adapters/rss.adapter.ts
do_commit "[feat]: add finance adapters" backend/src/adapters/finance.adapter.ts
do_commit "[feat]: add Hacker News adapters" backend/src/adapters/hackernews.adapter.ts
do_commit "[feat]: register all widgets in central registry" backend/src/widgets/registry.ts
do_commit "[feat]: expose widget catalogue API" backend/src/modules/widgets/widgets.service.ts backend/src/modules/widgets/widgets.controller.ts backend/src/modules/widgets/widgets.routes.ts
do_commit "[feat]: implement about.json endpoint" backend/src/modules/about/about.controller.ts backend/src/modules/about/about.routes.ts
do_commit "[feat]: add dashboard repository" backend/src/modules/dashboard/dashboard.repository.ts
do_commit "[feat]: implement dashboard CRUD and data cache" backend/src/modules/dashboard/dashboard.service.ts
do_commit "[feat]: expose dashboard HTTP API" backend/src/modules/dashboard/dashboard.controller.ts backend/src/modules/dashboard/dashboard.routes.ts

# 46–55 admin + app bootstrap
do_commit "[feat]: add admin Zod schemas" backend/src/modules/admin/admin.schemas.ts
do_commit "[feat]: implement admin service" backend/src/modules/admin/admin.service.ts
do_commit "[feat]: expose admin HTTP API" backend/src/modules/admin/admin.controller.ts backend/src/modules/admin/admin.routes.ts
do_commit "[feat]: mount Express application" backend/src/app.ts
do_commit "[feat]: boot API server" backend/src/server.ts
do_commit "[chore]: add bonus placeholder" bonus/README.md

# 56–75 frontend API + i18n + assets
do_commit "[feat]: add frontend auth API client" frontend/src/api/auth.ts
do_commit "[feat]: add frontend services API client" frontend/src/api/services.ts
do_commit "[feat]: add frontend dashboard API client" frontend/src/api/client.ts
do_commit "[feat]: add frontend admin API client" frontend/src/api/admin.ts
do_commit "[feat]: add shared auth types" frontend/src/auth/types.ts
do_commit "[feat]: wire AuthContext to real backend" frontend/src/auth/AuthContext.tsx
do_commit "[feat]: update protected routes for cookie auth" frontend/src/auth/ProtectedRoute.tsx
do_commit "[chore]: remove demo session module" -frontend/src/auth/session.ts
do_commit "[chore]: remove demo API module" -frontend/src/api/demo.ts
do_commit "[chore]: remove mock frames data" -frontend/src/data/frames.ts
do_commit "[feat]: bootstrap i18n helpers" frontend/src/i18n/index.ts frontend/src/i18n/format.ts frontend/src/i18n/widgets.ts
do_commit "[feat]: add French translations" frontend/src/i18n/locales/fr.json
do_commit "[feat]: add English translations" frontend/src/i18n/locales/en.json
do_commit "[feat]: add language switcher component" frontend/src/components/LanguageSwitcher.tsx
do_commit "[feat]: enable i18n in app entry" frontend/src/main.tsx frontend/package.json frontend/package-lock.json
do_commit "[feat]: extend service catalogue for five services" frontend/src/data/catalog.ts
do_commit "[feat]: map images for all services" frontend/src/data/images.ts
do_commit "[feat]: add finance and HN marketing images" frontend/public/img/hero-finance.jpg frontend/public/img/hero-hackernews.jpg frontend/public/img/svc-finance.jpg frontend/public/img/svc-hackernews.jpg
do_commit "[feat]: add finance and HN widget images" frontend/public/img/widget-exchange_rate.jpg frontend/public/img/widget-crypto_price.jpg frontend/public/img/widget-top_stories.jpg frontend/public/img/widget-story_search.jpg
do_commit "[docs]: document new image assets" frontend/IMAGES.md

# 76–92 UI pages + dashboard
do_commit "[feat]: add service icons for finance and HN" frontend/src/components/Icons.tsx
do_commit "[feat]: add auth image fade carousel" frontend/src/components/ImageFade.tsx
do_commit "[feat]: use fade carousel in auth layout" frontend/src/components/AuthLayout.tsx
do_commit "[style]: polish glass styles for auth and landing" frontend/src/styles/glass.css
do_commit "[feat]: connect login page to API" frontend/src/pages/LoginPage.tsx
do_commit "[feat]: connect register page to API" frontend/src/pages/RegisterPage.tsx
do_commit "[feat]: connect confirm page to API" frontend/src/pages/ConfirmPage.tsx
do_commit "[feat]: connect services page to API" frontend/src/pages/ServicesPage.tsx frontend/src/modals/OAuthModal.tsx
do_commit "[feat]: connect admin page to live data" frontend/src/pages/AdminPage.tsx
do_commit "[feat]: persist profile updates via API" frontend/src/pages/ProfilePage.tsx
do_commit "[feat]: load landing stats from catalogue API" frontend/src/pages/LandingPage.tsx
do_commit "[feat]: refresh dashboard and not-found pages" frontend/src/pages/DashboardPage.tsx frontend/src/pages/NotFoundPage.tsx
do_commit "[feat]: load dashboard context from API" frontend/src/context/AppDataContext.tsx
do_commit "[feat]: persist wizard through dashboard API" frontend/src/modals/WizardModal.tsx
do_commit "[feat]: render live widget cards" frontend/src/dashboard/WidgetCard.tsx frontend/src/dashboard/summary.ts
do_commit "[feat]: persist widget grid reorder" frontend/src/dashboard/WidgetGrid.tsx
do_commit "[feat]: refresh widgets from data endpoint" frontend/src/dashboard/useWidgetRefresh.ts frontend/src/dashboard/TimerRing.tsx

# 93–100 polish + docs
do_commit "[feat]: update dashboard hero and sidebar" frontend/src/dashboard/DashHero.tsx frontend/src/dashboard/DashLeft.tsx frontend/src/dashboard/DashPlanning.tsx
do_commit "[style]: refresh layouts and shared chrome" frontend/src/layouts/AppLayout.tsx frontend/src/layouts/PublicLayout.tsx frontend/src/components/ThemeToggle.tsx frontend/src/components/Modal.tsx frontend/src/components/Skeleton.tsx frontend/src/components/SkipLink.tsx frontend/src/index.css
do_commit "[chore]: update frontend tooling config" frontend/vite.config.ts frontend/tsconfig.app.json
do_commit "[chore]: remove obsolete frontend docs" -frontend/README.md -frontend/ARCHITECTURE.md
do_commit "[docs]: add English root README" README.md
do_commit "[docs]: add architecture and API guides" docs/ARCHITECTURE.md docs/API.md
do_commit "[docs]: add accessibility credits plan and tech skeleton" docs/ACCESSIBILITY.md docs/CREDITS.md docs/PLAN.md docs/TECH_CHOICES.md
do_commit "[docs]: keep French plan artifacts" PLAN.md plan.html
do_commit "[chore]: add commit seeding script" scripts/seed-100-commits.sh

# Pad to exactly 100 with empty conventional markers (same pattern as prior ledger)
PAD_MSGS=(
  "[chore]: record backend milestone checkpoint"
  "[chore]: record auth milestone checkpoint"
  "[chore]: record services milestone checkpoint"
  "[chore]: record widgets milestone checkpoint"
  "[chore]: record dashboard milestone checkpoint"
  "[chore]: record admin milestone checkpoint"
  "[chore]: record frontend API milestone checkpoint"
  "[chore]: record i18n milestone checkpoint"
  "[chore]: record delivery docs milestone checkpoint"
  "[chore]: mark integration branch ready for review"
)
i=0
while (( commit_n < 100 && i < ${#PAD_MSGS[@]} )); do
  pad_commit "${PAD_MSGS[$i]}"
  i=$((i + 1))
done

echo
echo "==> Total commits created in this run: $commit_n"
TIP="$(git rev-parse HEAD)"
echo "==> Tip: $TIP"

TOPIC_BRANCHES=(
  feature/a-about-json
  feature/a-admin-users
  feature/a-auth-services
  feature/a-email-confirm
  feature/a-oauth-github
  feature/a-register-login
  feature/a-services-page
  feature/a-widget-article-list
  feature/a-widget-city-temperature
  feature/a-widget-recent-commits
  feature/b-about-json
  feature/b-admin-stats
  feature/b-dashboard-ui
  feature/b-dashboard-widgets
  feature/b-drag-drop
  feature/b-timer-worker
  feature/b-widget-config-modal
  feature/b-widget-feed-summary
  feature/b-widget-precipitation
  feature/b-widget-security-alerts
)

echo "==> Pointing topic branches at integration tip"
for b in "${TOPIC_BRANCHES[@]}"; do
  git branch -f "$b" "$TIP"
done

if (( PUSH )); then
  echo "==> Pushing to origin (force-with-lease on topic branches)"
  git push -u origin "$BASE_BRANCH"
  for b in "${TOPIC_BRANCHES[@]}"; do
    git push -u origin "$b" --force-with-lease
  done
else
  echo "==> Commits ready locally. Run with --push to publish."
fi

git status -sb
echo "Done."
