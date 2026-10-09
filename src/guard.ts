export type ErrorSink = (error: unknown, context: string) => void;

/**
 * Wraps a callback so an exception is reported and `cleanup` runs, instead of
 * escaping into Mutter/GLib and leaving state (grabs, overlays) half-done.
 */
export function guard<A extends unknown[], R>(
    context: string,
    fn: (...args: A) => R,
    on_error: ErrorSink,
    cleanup?: () => void,
): (...args: A) => R | undefined {
    return (...args: A) => {
        try {
            return fn(...args);
        } catch (error) {
            on_error(error, context);
            if (cleanup) {
                try {
                    cleanup();
                } catch (cleanup_error) {
                    on_error(cleanup_error, context + ' (cleanup)');
                }
            }
            return undefined;
        }
    };
}
