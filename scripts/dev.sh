#!/bin/sh
# Run yatm in a nested GNOME Shell with isolated data/config dirs so the real
# session's extensions and dconf are never touched.
set -eu

ROOT=$(cd "$(dirname "$0")/.." && pwd)
DEV="$ROOT/.dev"

export XDG_DATA_HOME="$DEV/data"
export XDG_CONFIG_HOME="$DEV/config"
export XDG_STATE_HOME="$DEV/state"
mkdir -p "$XDG_DATA_HOME" "$XDG_CONFIG_HOME" "$XDG_STATE_HOME" "$DEV/logs"

make -C "$ROOT" compile install

LOG="$DEV/logs/shell-$(date +%Y%m%d-%H%M%S).log"
ln -sf "$LOG" "$DEV/logs/latest.log"
echo "Logging to $LOG"

exec dbus-run-session -- sh -c '
    gsettings set org.gnome.shell disable-user-extensions false
    gsettings set org.gnome.shell enabled-extensions "[\"yatm@diegofrsilva\"]"
    dconf write /org/gnome/shell/extensions/yatm/log-level "uint32 4"
    dconf write /org/gnome/shell/extensions/yatm/tile-by-default true
    exec gnome-shell --devkit
' >"$LOG" 2>&1
