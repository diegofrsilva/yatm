import { test } from 'node:test';
import assert from 'node:assert/strict';
import { find_conflicts } from '../src/conflicts.js';

const none = { enabled: [], session: [], disabled: [] };

test('no conflicts when only yatm is enabled', () => {
    assert.deepEqual(find_conflicts({ ...none, enabled: ['yatm@diegofrsilva', 'ubuntu-dock@ubuntu.com'] }), []);
});

test('user-enabled tiler is reported', () => {
    assert.deepEqual(find_conflicts({ ...none, enabled: ['pop-shell@system76.com'] }), ['pop-shell@system76.com']);
});

test('session-mode tiler counts unless the user disabled it', () => {
    const session = ['tiling-assistant@ubuntu.com'];
    assert.deepEqual(find_conflicts({ ...none, session }), ['tiling-assistant@ubuntu.com']);
    assert.deepEqual(find_conflicts({ ...none, session, disabled: session }), []);
});

test('each conflict listed once', () => {
    const uuid = 'paperwm@paperwm.github.com';
    assert.deepEqual(find_conflicts({ enabled: [uuid], session: [uuid], disabled: [] }), [uuid]);
});
