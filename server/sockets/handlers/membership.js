function requireHost(member) {
  if (member.role !== 'Host') throw Error('Host permission required');
}

export function registerMembership(handle, service, socket) {
  handle('create_room', ({ name, username }) => service.create(socket, name ?? username));
  handle('join_room', ({ roomId, name, username, token }) => service.join(socket, { roomId, name: name ?? username, token }));
  handle('leave_room', () => service.leave(socket));

  handle('assign_role', ({ userId, role }) => {
    const { room, member } = service.current(socket);
    requireHost(member);
    if (!['Moderator', 'Participant'].includes(role)) throw Error('Invalid role');
    const target = room.members.get(userId);
    if (!target || target.role === 'Host') throw Error('Invalid participant');
    target.role = role;
    service.publish(room);
  });

  handle('transfer_host', ({ userId }) => {
    const { room, member } = service.current(socket);
    requireHost(member);
    const target = room.members.get(userId);
    if (!target?.online || target === member) throw Error('Select an online participant');
    member.role = 'Moderator';
    target.role = 'Host';
    service.publish(room);
  });

  handle('remove_participant', ({ userId }) => {
    const { room, member } = service.current(socket);
    requireHost(member);
    const target = room.members.get(userId);
    if (!target || target === member) throw Error('Invalid participant');
    service.kick(room, target);
  });
}
