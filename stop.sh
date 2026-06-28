#!/usr/bin/env bash
# SIGKILL (-9), not the default SIGTERM: a *stopped* (Ctrl+Z'd) process ignores
# SIGTERM until it resumes, so it lingers and keeps port 5173 bound. SIGKILL is
# delivered regardless of stopped state.
pkill -9 -f vite || true
