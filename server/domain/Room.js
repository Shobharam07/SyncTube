import { randomUUID } from 'node:crypto';

export const canControl = role => ['Host', 'Moderator'].includes(role);
export const validVideo = id => typeof id === 'string' && /^[\w-]{11}$/.test(id);
export const validSeek = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 86400;
export const PLAYBACK_ACTIONS = ['play', 'pause', 'seek', 'change_video'];

export class Room {
  constructor(id) {
    this.id = id;
    this.members = new Map();
    this.requests = [];
    this.messages = [];
    this.state = { videoId: '', playing: false, time: 0, updatedAt: Date.now(), revision: 0, action: null };
  }

  position(now = Date.now()) {
    const elapsed = this.state.playing ? Math.max(0, now - this.state.updatedAt) / 1000 : 0;
    return this.state.time + elapsed;
  }

  snapshot() {
    const now = Date.now();
    return { ...this.state, time: this.position(now), updatedAt: now };
  }

  participants() {
    return [...this.members.values()].map(member => member.publicProfile());
  }

  validateAction(action, value) {
    if (!PLAYBACK_ACTIONS.includes(action)) throw Error('Invalid playback action');
    if (action === 'seek' && !validSeek(value)) throw Error('Invalid seek position');
    if (action === 'change_video' && !validVideo(value)) throw Error('Invalid YouTube video ID');
  }

  apply(action, value) {
    this.validateAction(action, value);
    const now = Date.now();
    const next = { ...this.state, time: this.position(now), updatedAt: now, revision: this.state.revision + 1, action };
    switch (action) {
      case 'play':
        next.playing = true;
        break;
      case 'pause':
        next.playing = false;
        break;
      case 'seek':
        next.time = value;
        break;
      case 'change_video':
        next.videoId = value;
        next.time = 0;
        next.playing = false;
        break;
    }
    this.state = next;
  }

  request(member, action, value) {
    this.validateAction(action, value);
    if (this.requests.length >= 100) throw Error('Request queue is full');
    if (this.requests.some(request => request.userId === member.id)) throw Error('You already have a pending request');
    const request = { id: randomUUID(), userId: member.id, name: member.name, action, value, videoId: this.state.videoId };
    this.requests.push(request);
    return request;
  }

  removeMember(memberId) {
    const member = this.members.get(memberId);
    if (member) clearTimeout(member.disconnectTimer);
    this.members.delete(memberId);
    this.requests = this.requests.filter(request => request.userId !== memberId);
  }
}
