#!/usr/bin/env bash
# SessionStart hook for Claude Code cloud sessions (claude.ai/code).
# Only runs when CLAUDE_CODE_REMOTE=true; a no-op on local machines.
# Installs npm deps, creates a dev .env, and starts Postgres + Redis if available.
set -u

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/..}" || exit 0

log() { echo "[cloud-setup] $*" >&2; }

# 1. Dev .env from the example (never real secrets; those go in the cloud environment settings).
if [ ! -f .env ]; then
  cp .env.example .env
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=cloud-dev-$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')|" .env
  log "created .env from .env.example"
fi

# 2. Node deps.
if [ -f package.json ] && [ ! -d node_modules ]; then
  if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi \
    || log "npm install failed"
fi

# 3. Postgres + Redis for test:room (best effort; skipped if apt is unavailable).
SUDO=""; [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null && SUDO="sudo"
if ! command -v pg_ctlcluster >/dev/null || ! command -v redis-server >/dev/null; then
  if command -v apt-get >/dev/null; then
    $SUDO apt-get update -qq >/dev/null 2>&1 \
      && $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql redis-server >/dev/null 2>&1 \
      || log "apt install postgresql/redis failed"
  fi
fi

if command -v redis-server >/dev/null && ! redis-cli ping >/dev/null 2>&1; then
  redis-server --daemonize yes >/dev/null && log "redis started"
fi

if command -v pg_ctlcluster >/dev/null; then
  ver=$(ls /etc/postgresql 2>/dev/null | sort -n | tail -1)
  if [ -n "$ver" ]; then
    $SUDO pg_ctlcluster "$ver" main start 2>/dev/null || true
    $SUDO -u postgres psql -qc "DO \$\$BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='cvo') THEN CREATE ROLE cvo LOGIN SUPERUSER PASSWORD 'cvo'; END IF; END\$\$;" >/dev/null 2>&1 || true
    $SUDO -u postgres createdb -O cvo cvo >/dev/null 2>&1 || true
    $SUDO -u postgres createdb -O cvo cvo_test >/dev/null 2>&1 || true
    log "postgres $ver ready (cvo/cvo)"
  fi
fi

exit 0
