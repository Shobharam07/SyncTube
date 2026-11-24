import test from 'node:test';
import assert from 'node:assert/strict';
import { Room, canControl } from '../domain/Room.js';
test('role permissions', () => {
  assert.equal(canControl('Host'), true);
  assert.equal(canControl('Moderator'), true);
  assert.equal(canControl('Participant'), false);
});
test('video, seek, play and pause', () => {
  const r = new Room('A');
  r.apply('change_video', 'dQw4w9WgXcQ');
  r.apply('seek', 150);
  r.apply('play');
  assert.ok(r.position(r.state.updatedAt + 2000) >= 152);
  r.apply('pause');
  assert.equal(r.state.playing, false);
  assert.throws(() => r.apply('seek', -1));
  assert.throws(() => r.apply('change_video', 'bad'));
});
test('request is queued without changing state', () => {
  const r = new Room('A'), m = { id: '1', name: 'A' };
  r.request(m, 'seek', 50);
  assert.equal(r.state.time, 0);
  assert.equal(r.requests.length, 1);
  assert.throws(() => r.request(m, 'play'));
  assert.throws(() => r.request({ id: '2' }, 'seek', NaN));
});
