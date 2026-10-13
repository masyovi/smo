#!/bin/bash
# SMO dev server launcher — starts Next.js dev server detached.
# Used by the cron tool / scheduled start so the process survives
# the bash tool's per-command cleanup.
cd /home/z/my-project

# Kill any stale dev server
pkill -9 -f "next dev" 2>/dev/null
sleep 2

# Start fresh, fully detached
rm -f /home/z/my-project/dev.log
nohup setsid bun run dev >> /home/z/my-project/dev.log 2>&1 < /dev/null &
disown
echo "SMO dev server launched at $(date)"
