import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    curve_value, parse_curve, IDENTITY, transform_for, visual_frame, transform_at,
    is_identity, frame_reached, dim_level, should_retime_switch, copy_box,
} from '../src/anim_math.js';

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);
const close_box = (a: any, b: any) => { for (const k of ['x', 'y', 'width', 'height']) close(a[k], b[k]); };

test('curves start at 0, end at 1 and only go up', () => {
    for (const c of ['ease-out-cubic', 'ease-out-expo'] as const) {
        close(curve_value(c, 0), 0);
        close(curve_value(c, 1), 1);
        let prev = -1;
        for (let i = 0; i <= 10; i++) {
            const v = curve_value(c, i / 10);
            assert.ok(v >= prev);
            prev = v;
        }
    }
});

test('curve input is clamped', () => {
    close(curve_value('ease-out-cubic', -1), 0);
    close(curve_value('ease-out-cubic', 2), 1);
});

test('unknown curve name falls back to cubic', () => {
    assert.equal(parse_curve('ease-out-expo'), 'ease-out-expo');
    assert.equal(parse_curve('bounce'), 'ease-out-cubic');
});

test('transform makes the new frame appear at the old rect (server-side decorations)', () => {
    const from = { x: 0, y: 0, width: 400, height: 300 };
    const frame = { x: 400, y: 0, width: 200, height: 300 };
    const t = transform_for(from, frame, frame);
    close_box(visual_frame(frame, frame, t), from);
});

test('transform accounts for client-side shadow offset', () => {
    const from = { x: 10, y: 20, width: 500, height: 400 };
    const frame = { x: 600, y: 50, width: 250, height: 200 };
    const buffer = { x: 576, y: 30, width: 298, height: 248 };
    close_box(visual_frame(frame, buffer, transform_for(from, frame, buffer)), from);
});

test('no movement means identity', () => {
    const r = { x: 5, y: 5, width: 100, height: 100 };
    assert.ok(is_identity(transform_for(r, r, r)));
});

test('transform_at goes from start to identity', () => {
    const start = { translation_x: -100, translation_y: 40, scale_x: 2, scale_y: 0.5 };
    assert.deepEqual(transform_at(start, 0), start);
    assert.deepEqual(transform_at(start, 1), IDENTITY);
    const mid = transform_at(start, 0.5);
    close(mid.translation_x, -50);
    close(mid.scale_x, 1.5);
});

test('interrupting halfway starts the next slide from where the window is seen', () => {
    const from = { x: 0, y: 0, width: 400, height: 300 };
    const frame = { x: 400, y: 0, width: 400, height: 300 };
    const halfway = transform_at(transform_for(from, frame, frame), 0.5);
    close_box(visual_frame(frame, frame, halfway), { x: 200, y: 0, width: 400, height: 300 });
});

test('frame_reached tolerates 1 px rounding', () => {
    const target = { x: 10, y: 10, width: 300, height: 200 };
    assert.ok(frame_reached({ x: 10, y: 11, width: 301, height: 200 }, target));
    assert.ok(!frame_reached({ x: 10, y: 10, width: 280, height: 200 }, target));
});

test('dim only unfocused tiled windows, never fullscreen ones', () => {
    const base = { enabled: true, amount: 15, tiled: true, focused: false, fullscreen: false };
    close(dim_level(base), -0.15);
    assert.equal(dim_level({ ...base, focused: true }), 0);
    assert.equal(dim_level({ ...base, tiled: false }), 0);
    assert.equal(dim_level({ ...base, fullscreen: true }), 0);
    assert.equal(dim_level({ ...base, enabled: false }), 0);
    close(dim_level({ ...base, amount: 200 }), -0.9);
});

test('only GNOME default-timed (keyboard) workspace switches are retimed', () => {
    assert.ok(should_retime_switch(250, 250));
    assert.ok(!should_retime_switch(180, 250));
    assert.ok(!should_retime_switch(undefined, 250));
});

test('copy_box reads getter-based rectangles (yatm Rectangle keeps values in an array)', () => {
    class GetterRect {
        array = [8, 40, 922, 466.5];
        get x() { return this.array[0]; }
        get y() { return this.array[1]; }
        get width() { return this.array[2]; }
        get height() { return this.array[3]; }
    }
    const src = new GetterRect();
    const copy = copy_box(src);
    src.array[2] = 1; // later mutation of the source must not leak into the copy
    assert.deepEqual(copy, { x: 8, y: 40, width: 922, height: 466.5 });
    assert.ok(frame_reached({ x: 8, y: 40, width: 922, height: 466 }, copy));
});
