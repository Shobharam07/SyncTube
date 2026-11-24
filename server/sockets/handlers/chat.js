import { randomUUID } from 'node:crypto';

export function registerChat(handle, service, socket) {
  handle('chat', ({ text }) => {
    const { room, member } = service.current(socket);
    if (typeof text !== 'string' || !text.trim() || text.length > 500) throw Error('Invalid message');
    room.messages.push({ id: randomUUID(), name: member.name, text: text.trim() });
    room.messages = room.messages.slice(-100);
    service.io.to(room.id).emit('chat_update', room.messages);
  });
}
