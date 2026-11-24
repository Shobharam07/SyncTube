import test from 'node:test';
import assert from 'node:assert/strict';
import { registerEvents } from '../sockets/registerEvents.js';

function createHarness() {
  const sockets = new Map();
  let connect;
  const io = {
    sockets: { sockets },
    on(event, handler) { if (event === 'connection') connect = handler; },
    to(roomId) {
      return {
        emit(event, data) {
          for (const socket of sockets.values()) {
            if (socket.rooms.has(roomId)) socket.emit(event, data);
          }
        }
      };
    }
  };
  registerEvents(io);

  function addSocket(id) {
    const handlers = new Map();
    const updates = new Map();
    const socket = {
      id,
      data: {},
      rooms: new Set(),
      on(event, handler) { handlers.set(event, handler); },
      emit(event, data) { updates.set(event, structuredClone(data)); },
      join(roomId) { this.rooms.add(roomId); },
      leave(roomId) { this.rooms.delete(roomId); },
      call(event, payload = {}) {
        let response;
        handlers.get(event)(payload, result => { response = result; });
        return response;
      },
      latest(event) { return updates.get(event); },
      disconnect() { handlers.get('disconnect')(); sockets.delete(id); }
    };
    sockets.set(id, socket);
    connect(socket);
    return socket;
  }
  return { addSocket };
}

test('room creation, synchronization, requests and role enforcement', () => {
  const { addSocket } = createHarness();
  const host = addSocket('host');
  const guest = addSocket('guest');
  const outsider = addSocket('outsider');
  const created = host.call('create_room', { name: 'Host' });
  assert.equal(created.ok, true);
  const joined = guest.call('join_room', { roomId: created.roomId, name: 'Guest', role: 'Host' });
  assert.equal(joined.ok, true);
  assert.equal(host.latest('room_update').participants.find(member => member.id === joined.userId).role, 'Participant');
  assert.equal(outsider.call('play').ok, false);
  assert.equal(host.call('change_video', { value: 'dQw4w9WgXcQ' }).ok, true);
  assert.equal(guest.latest('sync_state').videoId, 'dQw4w9WgXcQ');
  assert.equal(guest.call('seek', { value: 60 }).ok, false);
  assert.equal(guest.call('assign_role', { userId: joined.userId, role: 'Moderator' }).ok, false);
  assert.equal(guest.call('request_action', { action: 'seek', value: 60 }).ok, true);
  const request = host.latest('room_update').requests[0];
  assert.equal(guest.call('resolve_request', { id: request.id, approve: true }).ok, false);
  assert.equal(host.call('resolve_request', { id: request.id, approve: true }).ok, true);
  assert.equal(guest.latest('room_update').state.time, 60);
  assert.equal(host.call('assign_role', { userId: joined.userId, role: 'Moderator' }).ok, true);
  assert.equal(guest.call('play').ok, true);
  assert.equal(host.latest('sync_state').playing, true);
  assert.equal(guest.call('pause').ok, true);
  assert.equal(host.latest('sync_state').playing, false);
  assert.equal(guest.call('remove_participant', { userId: created.userId }).ok, false);
  assert.equal(guest.call('chat', { text: 'Hello' }).ok, true);
  assert.equal(host.latest('chat_update')[0].text, 'Hello');
  assert.equal(host.call('remove_participant', { userId: joined.userId }).ok, true);
  assert.equal(guest.call('play').ok, false);
  assert.equal(guest.call('join_room', { roomId: created.roomId, token: joined.token }).ok, false);
});

test('late join, room isolation, rejection and host transfer', () => {
  const { addSocket } = createHarness();
  const host = addSocket('a');
  const guest = addSocket('b');
  const other = addSocket('c');
  const room = host.call('create_room', { name: 'Host' });
  other.call('create_room', { name: 'Other' });
  host.call('change_video', { value: 'dQw4w9WgXcQ' });
  host.call('seek', { value: 20 });
  const member = guest.call('join_room', { roomId: room.roomId, name: 'Guest' });
  assert.equal(guest.latest('room_update').state.time, 20);
  assert.equal(other.latest('sync_state'), undefined);
  guest.call('request_action', { action: 'seek', value: 30 });
  const request = host.latest('room_update').requests[0];
  assert.equal(host.call('resolve_request', { id: request.id, approve: false }).ok, true);
  assert.equal(guest.latest('room_update').state.time, 20);
  assert.equal(host.call('transfer_host', { userId: member.userId }).ok, true);
  assert.equal(guest.latest('room_update').participants.find(person => person.id === member.userId).role, 'Host');
  assert.equal(host.call('assign_role', { userId: member.userId, role: 'Participant' }).ok, false);
  guest.disconnect();
  const reconnect = addSocket('d');
  assert.equal(reconnect.call('join_room', { roomId: room.roomId, token: member.token }).ok, true);
  assert.equal(reconnect.latest('room_update').participants.find(person => person.id === member.userId).role, 'Host');
});
