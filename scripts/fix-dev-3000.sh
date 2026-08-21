#!/bin/zsh
kill -9 $(lsof -ti:3000-3015) 2>/dev/null || true
sleep 1
cd "$(dirname "$0")/.."
rm -rf .next
npm run dev
