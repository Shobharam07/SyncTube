import { canControl, PLAYBACK_ACTIONS } from '../../domain/Room.js';

function requireController(member) {
  if (!canControl(member.role)) throw Error('Playback permission denied');
}

function requireVideo(room, action) {
  if (action !== 'change_video' && !room.state.videoId) throw Error('Load a video first');
}

export function registerPlayback(handle, service, socket) {
  for (const action of PLAYBACK_ACTIONS) {
    handle(action, payload => {
      const { room, member } = service.current(socket);
      requireController(member);
      requireVideo(room, action);
      const value = payload.value ?? (action === 'seek' ? payload.time : payload.videoId);
      room.apply(action, value);
      service.sync(room);
    });
  }

  handle('request_action', ({ action, value }) => {
    const { room, member } = service.current(socket);
    requireVideo(room, action);
    if (canControl(member.role)) throw Error('You already have playback permission');
    room.request(member, action, value);
    service.publish(room);
  });

  handle('resolve_request', ({ id, approve }) => {
    const { room, member } = service.current(socket);
    requireController(member);
    if (typeof approve !== 'boolean') throw Error('Invalid decision');
    const request = room.requests.find(item => item.id === id);
    if (!request) throw Error('Request not found');
    if (approve) {
      requireVideo(room, request.action);
      if (request.action !== 'change_video' && request.videoId !== room.state.videoId) {
        room.requests = room.requests.filter(item => item.id !== id);
        service.publish(room);
        service.notifyMember(room, request.userId, 'Your request expired because the video changed');
        throw Error('Request expired because the video changed');
      }
      room.apply(request.action, request.value);
    }
    room.requests = room.requests.filter(item => item.id !== id);
    service.publish(room);
    service.notifyMember(room, request.userId, approve ? 'Your playback request was approved' : 'Your playback request was rejected');
  });
}
