#!/usr/bin/env bash
set -euo pipefail

cd /workspaces/swirly

if [ ! -f packages/swirly-web/dist/index.html ]; then
  yarn turbo run build --filter=@swirly/web...
fi

if command -v fuser >/dev/null 2>&1; then
  fuser -k 8080/tcp >/dev/null 2>&1 || true
fi

cd packages/swirly-web/dist
nohup python3 -m http.server 8080 > /tmp/swirly-http-server.log 2>&1 &
