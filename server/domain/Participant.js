import { randomBytes, randomUUID } from 'node:crypto';

export class Participant {
  constructor(name, role) {
    this.id = randomUUID();
    this.token = randomBytes(32).toString('hex');
    this.name = name;
    this.role = role;
    this.online = false;
    this.socketId = null;
    this.disconnectTimer = null;
  }

  publicProfile() {
    const { id, name, role, online } = this;
    return { id, name, role, online };
  }
}
