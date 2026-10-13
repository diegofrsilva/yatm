interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Whether a stack should turn back into a plain tile. A stack that has held
 * several windows and is down to one dissolves; a stack just made from a single
 * window (the stacking shortcut) stays, so windows can be added to it.
 */
export function dissolves(windows: number, held_several: boolean): boolean {
    return windows === 1 && held_several;
}

/** The area a stack's windows get: the stack's area minus the tab bar on top. */
export function stack_window_area(area: Box, tab_height: number): Box {
    // Explicit fields: yatm's Rectangle keeps its values behind getters.
    return { x: area.x, y: area.y + tab_height, width: area.width, height: area.height - tab_height };
}
