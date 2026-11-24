import { RoomService } from '../services/RoomService.js';
import { registerMembership } from './handlers/membership.js';
import { registerPlayback } from './handlers/playback.js';
import { registerChat } from './handlers/chat.js';

export function registerEvents(io) {
  const service = new RoomService(io);

  io.on('connection', socket => {
    let windowStart = Date.now();
    let count = 0;

    function handle(event, handler) {
      socket.on(event, (data = {}, acknowledge) => {
        if (typeof acknowledge !== 'function') return;
        try {
          if (Date.now() - windowStart >= 10000) {
            windowStart = Date.now();
            count = 0;
          }
          if (++count > 100) throw Error('Too many actions');
          if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('Invalid payload');
          const result = handler(data);
          acknowledge({ ok: true, ...result });
        } catch (error) {
          acknowledge({ ok: false, error: error.message });
        }
      });
    }

    registerMembership(handle, service, socket);
    registerPlayback(handle, service, socket);
    registerChat(handle, service, socket);
    socket.on('disconnect', () => service.leave(socket, false));
  });

  const timer = setInterval(() => service.syncAll(), 5000);
  timer.unref();
  return () => clearInterval(timer);
}
