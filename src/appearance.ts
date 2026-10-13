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

/** '#rgb', '#rrggbb', 'rgb(r,g,b)' or 'rgba(r,g,b,a)' as [r, g, b, a] in 0..1; null otherwise. */
export function css_color_rgba(color: string): [number, number, number, number] | null {
    const s = color.trim().toLowerCase();

    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(s);
    if (hex) {
        const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
        return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).concat(1) as [number, number, number, number];
    }

    const fn = /^rgba?\(([^)]*)\)$/.exec(s);
    if (fn) {
        const parts = fn[1].split(',').map((p) => Number(p.trim()));
        if ((parts.length === 3 || parts.length === 4) && parts.every((n) => Number.isFinite(n))) {
            const [r, g, b, a = 1] = parts;
            return [r / 255, g / 255, b / 255, a];
        }
    }

    return null;
}
