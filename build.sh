#!/usr/bin/env bash
# Render build script for RailOpt
# This runs ONCE at build time on Render

set -e

echo "=== [1/3] Installing Python dependencies ==="
pip install -r backend/requirements.txt

echo "=== [2/3] Installing Node.js and building React frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== [3/3] Build complete — frontend/dist is ready ==="
ls -la frontend/dist/
