#!/bin/sh
set -eu
cd /workspace
node scripts/preview.mjs stop || true
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
export QVAC_CONFIG_PATH="${QVAC_CONFIG_PATH:-/workspace/qvac.config.json}"
npm run dev >>/tmp/app-startup.log 2>&1 &
