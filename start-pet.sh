#!/usr/bin/env bash
# ==========================================================
# Awesome Antigravity Pet - macOS & Linux Silent Launcher
# One-click background launcher for macOS and Linux.
# ==========================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Launch silently in the background detached from terminal
nohup python3 -m antigravity_pet enable >/dev/null 2>&1 &
echo "✨ Antigravity Desktop Pet companion launched in background!"
