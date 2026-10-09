/** libadwaita accent colors, keyed by org.gnome.desktop.interface accent-color. */
export const ACCENT_COLORS: Readonly<Record<string, string>> = {
    blue: '#3584e4',
    teal: '#2190a4',
    green: '#3a944a',
    yellow: '#c88800',
    orange: '#ed5b00',
    red: '#e62d42',
    pink: '#d56199',
    purple: '#9141ac',
    slate: '#6f8396',
};

/** The border sits in the gap; each window owns half the inner gap, so never exceed that. */
export function fit_border_width(requested: number, gap_inner_px: number): number {
    return Math.max(0, Math.min(requested, Math.floor(gap_inner_px / 2)));
}

/** Outer radius of a border drawn around a window with `corner_radius` corners. */
export function border_radius_for(corner_radius: number, border_width: number): number {
    return corner_radius > 0 ? corner_radius + border_width : 0;
}

/** A non-empty custom color wins; otherwise follow the GNOME accent color. */
export function resolve_border_color(custom: string, accent: string): string {
    if (custom.trim() !== '') return custom;
    return ACCENT_COLORS[accent] ?? ACCENT_COLORS.blue;
}
