/** What the panic reset needs from the extension to restart tiling. */
export interface TilerControl {
    running(): boolean;
    enabled_by_default(): boolean;
    /** Tear down the current tiler; may throw if its state is corrupt. */
    stop(): void;
    /** Drop the reference to the tiler, whatever state it was left in. */
    forget(): void;
    start(): void;
}

/**
 * Steps that restart the auto-tiler. Whether tiling should be on is decided
 * up front, so a failed teardown (or an already-lost tiler) still ends with
 * tiling restarted.
 */
export function restart_tiler_steps(t: TilerControl): Array<[string, () => void]> {
    const want = t.running() || t.enabled_by_default();

    return [
        ['stop tiler', () => {
            try {
                if (t.running()) t.stop();
            } finally {
                t.forget();
            }
        }],
        ['start tiler', () => {
            if (want) t.start();
        }],
    ];
}
