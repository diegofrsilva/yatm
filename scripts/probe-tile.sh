#!/bin/bash
# Usage: scripts/probe-tile.sh N
# Starts the nested yatm session, opens N probe windows 3 s apart, prints each
# window's final size ("w<n> <W>x<H>", after a "monitor <W>x<H>" line), then
# shuts the session down.
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"
N=${1:-1}
OUT=$(mktemp)

./scripts/dev.sh >/dev/null 2>&1 &
for _ in $(seq 1 60); do grep -q "GNOME Shell started" .dev/logs/latest.log 2>/dev/null && break; sleep 0.5; done
SOCK=$(grep -o "Using Wayland display name '[^']*'" .dev/logs/latest.log | tail -1 | cut -d"'" -f2)
for _ in $(seq 1 20); do [ -S "$XDG_RUNTIME_DIR/$SOCK" ] && break; sleep 0.5; done
sleep 3

for n in $(seq 1 "$N"); do
    WAYLAND_DISPLAY=$SOCK GDK_BACKEND=wayland gjs scripts/probe.js "w$n" >>"$OUT" 2>/dev/null &
    sleep 3
done
sleep 2

pkill -f "^gnome-shell --devkit$"
wait 2>/dev/null
echo "monitor $(grep " monitor [0-9]" "$OUT" | tail -1 | awk '{print $3}')"
for n in $(seq 1 "$N"); do
    echo "w$n $(grep " w$n [0-9]" "$OUT" | tail -1 | awk '{print $3}')"
done
rm -f "$OUT"
