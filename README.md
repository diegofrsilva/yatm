# yatm

**Yet Another Tiling Manager, a fork from [Pop Shell](https://github.com/pop-os/shell).**

Hyprland/yabai-style dynamic tiling for GNOME Shell.

yatm is a fork of [Pop Shell](https://github.com/pop-os/shell) by System76 (GPL-3.0). Most of the
tiling engine, keyboard shortcuts and the documentation further down come from the original project.
This fork adds stability fixes, GNOME 50 support and a more polished, animated look.

> **Tested only on Ubuntu 26.04 LTS with GNOME Shell 50.1 (Wayland).** Other distributions,
> GNOME versions or X11 sessions may work, but they have not been tried. The extension metadata
> only declares support for GNOME 50.

## Customisations in this fork

### Stability
- The event queue survives handler errors (the root cause of shell freezes).
- Grab handlers and the drag overlay are guarded, so an error always releases the mouse grab.
- Startup fixes: monitor geometry isn't queried before monitors exist, and floating windows
  aren't raised before they're mapped.
- A failing keybinding conflict check can no longer abort enabling the extension.
- **Panic reset:** `Super` + `Ctrl` + `Esc` tears tiling down and restarts it, even if teardown fails.
- A warning is shown when another tiling extension is enabled at the same time.
- Ported to the GNOME 50 / Mutter 18 maximize API.

### Look and feel
- Smart gaps and the active-window hint are on by default.
- Focus border with a configurable width, following the system accent colour by default
  (or a custom colour), with a radius concentric to the window corners.
- Rounded corners on tiled windows (GLSL effect, 15 px by default to match libadwaita);
  maximized and fullscreen windows keep square corners.
- Optional dimming of inactive tiled windows.

### Animations
- Tiling motion is animated: windows slide and resize from their current visual position,
  and an interrupted animation continues from where it is.
- New windows scale and fade in at their tile (replacing GNOME's map effect).
- Workspace switching uses yatm's duration and easing curve.
- Duration and curve are configurable.

### Mouse resizing
- While you drag the edge of a tiled window, the neighbouring tiles resize live instead of
  overlapping or exposing the desktop.

### Stacks
- One-piece look: a taller tab bar joined to the windows, which lose their top corner radius.
- An **unstack all** button on the tab bar turns every window of the stack back into a tile.
- A stack down to its last window turns back into a plain tile.
- Tab bar colour setting, following the accent colour by default: the active tab uses the
  colour and the other tabs a darker shade.
- The stack layout reserves the real tab bar height, so the bar no longer slides under the top
  bar.

### Preferences
- A libadwaita Appearance page in the preferences, with settings for borders, corners, stacks,
  animations and inactive windows.

### Renaming
- The extension is renamed to `yatm@diegofrsilva`, with its own settings schema
  (`org.gnome.shell.extensions.yatm`) and config directory (`~/.config/yatm`), so it doesn't clash
  with an installed Pop Shell. Don't enable both at once.

## Install

Requires GNU Make and the TypeScript compiler `tsc` on your `PATH` (for example
`sudo npm install -g typescript`, or the `node-typescript` package). Node.js is also needed for the tests.

```sh
make compile install
gnome-extensions enable yatm@diegofrsilva
```

On Wayland, log out and back in for the shell to load the new version. `make uninstall` removes it.

### Known shortcut conflict

On GNOME 50, `Super` + `S` opens Quick Settings, which conflicts with yatm's default "toggle
stacking" shortcut. Rebind one of them if you use stacks from the keyboard.

## Development

- `make dev` runs a nested GNOME Shell session with isolated settings under `.dev/`.
- `make test` runs the unit tests for the pure modules.

The sections below are the original Pop Shell documentation. They still describe the tiling
behaviour and shortcuts, but anything about Pop!_OS, packaging or release branches refers to the
upstream project, not this fork.

## Table of Contents

- [The Proposal](#the-proposal): Possible upstreaming into GNOME
- [The Problem](#the-problem): Why we need this in GNOME
- [Pop Shell Installation](#pop-shell-installation): How the upstream project is installed (not yatm)
- The Solution:
  - [Shared Features](#shared-features): Behaviors shared between stacking and auto-tiling modes
  - [Floating Mode](#floating-mode): Behaviors specific to the floating mode
  - [Tiling Mode](#tiling-mode): Behaviors specific to the auto-tiling mode
- [Developers](#developers): Guide for getting started with development
---

## The Proposal

A proposal for integration of the tiling window management features from Pop Shell into GNOME is currently under development. It will be created as a GitLab issue on GNOME Shell for future discussion, once we have invested our time into producing a functioning prototype, and learned what does and does not work in practice.

Ideally, the features explored in Pop Shell will be available for any environment using Mutter — far extending the half-monitor tiling capability currently present. By starting out as a shell extension, anyone using GNOME Shell can install this onto their system, without having to install a Pop-specific fork of GNOME on their system.

---

## The Problem

So, why is this a problem for us, and why do so many of our users switch to i3wm?

### Displays are large, and windows are many

GNOME currently only supports half-tiling, which tiles one window to one side of the screen, and another window to the other side of the screen. If you have more than two windows, it is expected to place them on separate workspaces, monitors, or to alternate between windows with `Alt` + `Tab`.

This tends to work fine if you only have a small handful of applications. If you need more than two windows at a time on a display, your only option is to manually drag windows into position, and resize them to fit alongside each other — a very time-consuming process that could easily be automated and streamlined.

### Displays are large. Very, **very** large

Suppose you are a lucky — or perhaps unlucky — owner of an ultra-wide display. A maximized window will have much of its preferences and controls dispersed across the far left and far right corners. The application may place a panel with buttons on the far left, while other buttons get shifted to either the distant center or far right.

Half-tiling in this scenario means that each window will be as large as an entire 2560x1440 or 4K display. In either scenario, at such extreme sizes, the mouse becomes completely useless — and applications become unbearable to use — in practice.

### Fighting the window manager is futile

As you struggle with fighting the window manager, it quickly becomes clear that any attempt to manage windows in a traditional stacking manner — where you need to manually move windows into place, and then manually resize them — is futile. Humans are nowhere near as precise or as quick as algorithms at aligning windows alongside each other on a display.

### Why not switch to i3wm?

The GNOME desktop comes with many useful desktop integration features, which are lost when switching to an i3wm session. Although possible to connect various GNOME session services to an i3wm session, much of the GNOME desktop experience is still lost in the process. The application overview, the GNOME panel, and GNOME extensions.

Even worse, many users are completely unfamiliar with tiling window managers, and may never feel comfortable switching "cold turkey" to one. By offering tiling window management as a feature that can be opted into, we can empower the user to ease into gaining greater control over their desktop, so that the idea of tiling window management suddenly becomes accessible.

There are additionally those who do want the traditional stacking window management experience, but they also want to be able to opt into advanced tiling window management, too. So it should be possible to opt into tiling window management as necessary. Other operating systems have successfully combined tiling window management features with the traditional stacking window management experience, and we feel that we can do this with GNOME as well.

---

## Pop Shell Installation

> This section is about upstream Pop Shell. For yatm, see [Install](#install) above.

Use the branch corresponding to your GNOME Shell version (`git checkout branch_name`):

- **GNOME 3.36 through 41:** Use the `master_focal` branch.
- **GNOME 42 through 44:** Use the `master_jammy` branch.
- **GNOME 45:** Use the `master_mantic` branch.
- **GNOME 46+:** Use the `master_noble` branch.

GNU Make and TypeScript are also required to build the project.

Proper functionality of the shell requires modifying GNOME's default keyboard shortcuts. For a local installation, run `make local-install`.

If you want to uninstall the extension, you may invoke `make uninstall`, and then open the "Keyboard Shortcuts" panel in GNOME Settings to select the "Reset All.." button in the header bar.

> Note that if you are packaging for your Linux distribution, many features in Pop Shell will not work out of the box because they require changes to GNOME's default keyboard shortcuts. A local install is necessary if you aren't packaging your GNOME session with these default keyboard shortcuts unset or changed.

### Packaging status

- [Fedora](https://src.fedoraproject.org/rpms/gnome-shell-extension-pop-shell/): `sudo dnf install gnome-shell-extension-pop-shell xprop`
- [Gentoo](https://packages.gentoo.org/packages/gnome-extra/gnome-shell-extension-pop-shell): `emerge gnome-shell-extension-pop-shell`
- [openSUSE Tumbleweed](https://build.opensuse.org/package/show/openSUSE:Factory/gnome-shell-extension-pop-shell): `sudo zypper install gnome-shell-extension-pop-shell`
- [Arch Linux](https://aur.archlinux.org/packages/?O=0&K=gnome-shell-extension-pop-shell) (Using Yay as AUR helper):
    - `yay -S gnome-shell-extension-pop-shell`
    - For precompiled binary version: `yay -S gnome-shell-extension-pop-shell-bin`
    - For GitHub repository version: `yay -S gnome-shell-extension-pop-shell-git`

---

## Shared Features

Features that are shared between stacking and auto-tiling modes.

### Directional Keys

These are key to many of the shortcuts utilized by tiling window managers. This document will henceforth refer to these keys as `<Direction>`, which default to the following keys:

- `Left` or `h`
- `Down` or `j`
- `Up` or `k`
- `Right` or `l`

### Overridden GNOME Shortcuts

- `Super` + `q`: Close window
- `Super` + `m`: Maximize the focused window
- `Super` + `,`: Minimize the focused window
- `Super` + `Esc`: Lock screen
- `Super` + `f`: Files
- `Super` + `e`: Email
- `Super` + `b`: Web Browser
- `Super` + `t`: Terminal

### Window Management Mode

> This mode is activated with `Super` + `Return`.

Window management mode activates additional keyboard control over the size and location of the currently-focused window. The behavior of this mode changes slightly based on whether you are in auto-tile mode, or in the default stacking mode. In the default mode, an overlay is displayed snapped to a grid, which represents a possible future location and size of your focused window. This behavior changes slightly in auto-tiling mode, where resizes are performed immediately and overlays are only shown when swapping windows.

Activating this enables the following behaviors:

- `<Direction>`
  - In default mode, this will move the displayed overlay around based on a grid
  - In auto-tile mode, this will resize the window
- `Shift` + `<Direction>`
  - In default mode, this will resize the overlay
  - In auto-tile mode, this will do nothing
- `Ctrl` + `<Direction>`
  - Selects a window in the given direction of the overlay
  - When `Return` is pressed, window positions will be swapped
- `Shift` + `Ctrl` + `<Direction>`
  - In auto-tile mode, this resizes in the opposite direction
- `O`: Toggles between horizontal and vertical tiling in auto-tile mode
- `~`: Toggles between floating and tiling in auto-tile mode
- `Return`: Applies the changes that have been requested
- `Esc`: Cancels any changes that were requested

### Window Focus Switching

When not in window management mode, pressing `Super` + `<Direction>` will shift window focus to a window in the given direction. This is calculated based on the distance between the center of the side of the focused window that the window is being shifted from, and the opposite side of windows surrounding it.

Switching focus to the left will calculate from the center of the east side of the focused window to the center of the west side of all other windows. The window with the least distance is the window we pick.

### Launcher

Pop Shell provides an integrated launcher which interfaces directly with our [pop-launcher](https://github.com/pop-os/launcher) service. JSON IPC is used to communicate between the shell and the launcher in an asynchronous fashion. This functionality was separated from the shell due to performance and maintainability issues. The new launcher is written in Rust and fully async. The launcher has extensive features that would be useful for implementing desktop launchers beyond a shell extension.

### Inner and Outer Gaps

Gaps improve the aesthetics of tiled windows and make it easier to grab the edge of a specific window. We've decided to add support for inner and outer gaps, and made these settings configurable in the extension's popup menu.

### Hiding Window Title Bars

Windows with server-side decorations may have their title bars completely hidden, resulting in additional screen real estate for your applications, and a visually cleaner environment. This feature can be toggled in the extension's popup menu. Windows can be moved with the mouse by holding `Super` when clicking and dragging a window to another location, or using the keyboard shortcuts native to pop-shell. Windows may be closed by pressing `Super` + `Q`, and maximized with `Super` + `M`.

---

## Floating Mode

This is the default mode of Pop Shell, which combines traditional stacking window management, with optional tiling window management features.

### Display Grid

In this mode, displays are split into a grid of columns and rows. When entering tile mode, windows are snapped to this grid as they are placed. The number of rows and columns are configurable in the extension's popup menu in the panel.

### Snap-to-Grid

An optional feature to improve your tiling experience is the ability to snap windows to the grid when using your mouse to move and resize them. This provides the same precision as entering window management mode to position a window with your keyboard, but with the convenience and familiarity of a mouse. This feature can be enabled through the extension's popup menu.

---

## Tiling Mode

Disabled by default, this mode manages windows using a tree-based tiling window manager. Similar to i3, each node of the tree represents two branches. A branch may be a window, a fork containing more branches, or a stack that contains many windows. Each branch represents a rectangular area of space on the screen, and can be subdivided by creating more branches inside of a branch. As windows are created, they are assigned to the window or stack that is actively focused, which creates a new fork on a window, or attaches the window to the focused stack. As windows are destroyed, the opposite is performed to compress the tree and rearrange windows to their new dimensions.

### Keyboard Shortcuts

- `Super` + `O`
  - Toggles the orientation of a fork's tiling orientation
- `Super` + `G`
  - Toggles a window between floating and tiling.
  - See [#customizing the window float list](#customizing-the-floating-window-list)

### Customizing the Floating Window List
There is file `$XDG_CONFIG_HOME/yatm/config.json` where you can add the following structure:
```
{
  class: "<WM_CLASS String from xprop>",
  title: "<Optional Window Title>"
}
```
For example, doing `xprop` on GNOME Settings (or GNOME Control Center), the WM_CLASS values are `gnome-control-center` and `Gnome-control-center`. Use the second value (Gnome-control-center), which pop-shell will read. The `title` field is optional.

After applying changes in `config.json`, you can reload the tiling if it doesn't work the first time.

## Developers

Due to the risky nature of plain JavaScript, this GNOME Shell extension is written in [TypeScript](https://www.typescriptlang.org/). In addition to supplying static type-checking and self-documenting classes and interfaces, it allows us to write modern JavaScript syntax whilst supporting the generation of code for older targets.

Please install the following as dependencies when developing:

- [`Node.js`](https://nodejs.org/en/) LTS+ (v12+)
- Latest `npm` (comes with NodeJS)
- `npm install typescript@latest`

While working on the shell, you can recompile, reconfigure, reinstall, and restart GNOME Shell with logging with `make debug`. Note that this only works reliably in X11 sessions, since Wayland will exit to the login screen on restarting the shell.

[Discussions welcome on Pop Chat](https://chat.pop-os.org/pop-os/channels/development)

## License

Licensed under the GNU General Public License, Version 3.0, ([LICENSE](LICENSE) or https://www.gnu.org/licenses/gpl-3.0.en.html)

### Contribution

Any contribution intentionally submitted for inclusion in the work by you shall be licensed under the GNU GPLv3.
