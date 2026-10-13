import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fit_border_width, border_radius_for, resolve_border_color, ACCENT_COLORS, css_color_rgba, muted_color, contrast_text } from '../src/appearance.js';

test('border fits inside half the inner gap', () => {
    assert.equal(fit_border_width(2, 8), 2);
    assert.equal(fit_border_width(6, 8), 4);
    assert.equal(fit_border_width(3, 5), 2);
});

test('no gap means no border, never negative', () => {
    assert.equal(fit_border_width(2, 0), 0);
    assert.equal(fit_border_width(0, 8), 0);
    assert.equal(fit_border_width(-3, 8), 0);
});

test('border radius is concentric with the window corner', () => {
    assert.equal(border_radius_for(8, 2), 10);
    assert.equal(border_radius_for(8, 0), 8);
});

test('square corners give a square border', () => {
    assert.equal(border_radius_for(0, 2), 0);
});

test('custom color wins over accent', () => {
    assert.equal(resolve_border_color('rgba(251, 184, 108, 1)', 'blue'), 'rgba(251, 184, 108, 1)');
});

test('empty custom color follows the accent', () => {
    assert.equal(resolve_border_color('', 'orange'), ACCENT_COLORS.orange);
    assert.equal(resolve_border_color('  ', 'teal'), ACCENT_COLORS.teal);
});

test('unknown accent falls back to blue', () => {
    assert.equal(resolve_border_color('', 'chartreuse'), ACCENT_COLORS.blue);
});

test('css_color_rgba parses hex colors to 0..1 components', () => {
    assert.deepEqual(css_color_rgba('#3584e4'), [0x35 / 255, 0x84 / 255, 0xe4 / 255, 1]);
    assert.deepEqual(css_color_rgba('#fff'), [1, 1, 1, 1]);
});

test('css_color_rgba parses rgb() and rgba() (Gdk.RGBA.to_string output)', () => {
    assert.deepEqual(css_color_rgba('rgb(255,0,0)'), [1, 0, 0, 1]);
    assert.deepEqual(css_color_rgba('rgba(251, 184, 108, 0.5)'), [251 / 255, 184 / 255, 108 / 255, 0.5]);
});

test('css_color_rgba rejects anything else', () => {
    assert.equal(css_color_rgba('blue'), null);
    assert.equal(css_color_rgba('#12'), null);
    assert.equal(css_color_rgba(''), null);
});

test('muted_color is the color mixed half-way with dark grey (#303030), alpha kept', () => {
    assert.equal(muted_color('#3584e4'), 'rgba(51, 90, 138, 1)');
    assert.equal(muted_color('rgba(255, 255, 255, 0.5)'), 'rgba(152, 152, 152, 0.5)');
    assert.equal(muted_color('nonsense'), null);
});

test('contrast_text picks white on dark colors and black on light ones', () => {
    assert.equal(contrast_text('#3584e4'), 'white');
    assert.equal(contrast_text('rgba(51, 90, 138, 1)'), 'white');
    assert.equal(contrast_text('#c88800'), 'black');
    assert.equal(contrast_text('#ffffff'), 'black');
    assert.equal(contrast_text('nonsense'), 'black');
});
