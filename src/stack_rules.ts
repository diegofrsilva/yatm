/**
 * Whether a stack should turn back into a plain tile. A stack that has held
 * several windows and is down to one dissolves; a stack just made from a single
 * window (the stacking shortcut) stays, so windows can be added to it.
 */
export function dissolves(windows: number, held_several: boolean): boolean {
    return windows === 1 && held_several;
}
