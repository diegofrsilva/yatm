import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fit_border_width, border_radius_for, resolve_border_color, ACCENT_COLORS } from '../src/appearance.js';

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
