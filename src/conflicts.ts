/** Extensions that also manage window placement and fight with yatm. */
export const CONFLICTING_EXTENSIONS: readonly string[] = [
    'pop-shell@system76.com',
    'tilingshell@ferrarodomenico.com',
    'paperwm@paperwm.github.com',
    'tiling-assistant@ubuntu.com',
    'tiling-assistant@leleat-on-github',
    'tactile@lundal.io',
    'forge@jmmaranan.com',
];

/**
 * Effective enabled set = user-enabled ∪ session-mode-enabled, minus
 * user-disabled. Returns the conflicting UUIDs in it.
 */
export function find_conflicts(state: {
    enabled: readonly string[];
    session: readonly string[];
    disabled: readonly string[];
}): string[] {
    const active = new Set([...state.enabled, ...state.session.filter((u) => !state.disabled.includes(u))]);
    return CONFLICTING_EXTENSIONS.filter((uuid) => active.has(uuid));
}
