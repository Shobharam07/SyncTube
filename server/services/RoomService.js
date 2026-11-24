import { randomBytes } from 'node:crypto';
import { Room } from '../domain/Room.js';
import { Participant } from '../domain/Participant.js';

const ROOM_LIMIT = 1000;
const MEMBER_LIMIT = 50;
const RECONNECT_GRACE_MS = 60000;

export class RoomService {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
  }

  publish(room) {
    this.io.to(room.id).emit('room_update', {
      id: room.id,
      participants: room.participants(),
      requests: room.requests,
      messages: room.messages,
      state: room.snapshot()
    });
  }

  sync(room) {
    this.io.to(room.id).emit('sync_state', room.snapshot());
  }

  syncAll() {
    for (const room of this.rooms.values()) this.sync(room);
  }

  current(socket) {
    const room = this.rooms.get(socket.data.roomId);
    const member = room?.members.get(socket.data.memberId);
    if (!member || member.socketId !== socket.id || !member.online) throw Error('Join a room first');
    return { room, member };
  }

  attach(socket, room, member) {
    clearTimeout(member.disconnectTimer);
    member.disconnectTimer = null;
    member.online = true;
    member.socketId = socket.id;
    socket.data.roomId = room.id;
    socket.data.memberId = member.id;
    socket.join(room.id);
    this.publish(room);
    return { roomId: room.id, userId: member.id, token: member.token };
  }

  addMember(socket, room, name, role) {
    if (socket.data.memberId) throw Error('Leave your current room first');
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 32) throw Error('Enter a name of 1–32 characters');
    if (room.members.size >= MEMBER_LIMIT) throw Error('Room is full');
    const member = new Participant(name.trim(), role);
    room.members.set(member.id, member);
    return this.attach(socket, room, member);
  }

  create(socket, name) {
    if (this.rooms.size >= ROOM_LIMIT) throw Error('Room capacity reached');
    let id;
    do {
      id = randomBytes(4).toString('hex').toUpperCase();
    } while (this.rooms.has(id));
    const room = new Room(id);
    const session = this.addMember(socket, room, name, 'Host');
    this.rooms.set(id, room);
    return session;
  }

  join(socket, { roomId, name, token }) {
    const room = this.rooms.get(String(roomId).trim().toUpperCase());
    if (!room) throw Error('Room not found');
    if (!token) return this.addMember(socket, room, name, 'Participant');
    if (typeof token !== 'string') throw Error('Invalid session');
    const member = [...room.members.values()].find(person => person.token === token);
    if (!member) throw Error('Session expired');
    if (socket.data.memberId && socket.data.memberId !== member.id) throw Error('Leave your current room first');
    if (member.online && member.socketId !== socket.id) {
      const old = this.io.sockets.sockets.get(member.socketId);
      if (old) this.detachSocket(old, room, 'Session opened elsewhere');
    }
    return this.attach(socket, room, member);
  }

  detachSocket(socket, room, message) {
    socket.leave(room.id);
    socket.data.roomId = null;
    socket.data.memberId = null;
    if (message) socket.emit('removed', message);
  }

  remove(room, member) {
    if (!room.members.has(member.id)) return;
    room.removeMember(member.id);
    if (member.role === 'Host') {
      const next = [...room.members.values()].sort((a, b) => Number(b.online) - Number(a.online))[0];
      if (next) next.role = 'Host';
    }
    if (room.members.size === 0) this.rooms.delete(room.id);
    else this.publish(room);
  }

  leave(socket, immediate = true) {
    const room = this.rooms.get(socket.data.roomId);
    const member = room?.members.get(socket.data.memberId);
    if (!member || member.socketId !== socket.id) return;
    this.detachSocket(socket, room);
    member.online = false;
    clearTimeout(member.disconnectTimer);
    if (immediate) {
      this.remove(room, member);
      return;
    }
    this.publish(room);
    member.disconnectTimer = setTimeout(() => {
      if (!member.online) this.remove(room, member);
    }, RECONNECT_GRACE_MS);
    member.disconnectTimer.unref();
  }

  kick(room, member) {
    const socket = this.io.sockets.sockets.get(member.socketId);
    if (socket) this.detachSocket(socket, room, 'The host removed you');
    this.remove(room, member);
  }

  notifyMember(room, memberId, message) {
    const member = room.members.get(memberId);
    if (member?.online) this.io.sockets.sockets.get(member.socketId)?.emit('notice', message);
  }
}
