import React from 'react';

export default function Participants({ participants, userId, host, connected, call }) {
  function manage(person, choice) {
    if (!choice) return;
    if (choice === 'remove' || choice === 'transfer') {
      const label = choice === 'remove' ? 'Remove' : 'Transfer host to';
      if (window.confirm(`${label} ${person.name}?`)) {
        call(choice === 'remove' ? 'remove_participant' : 'transfer_host', { userId: person.id });
      }
      return;
    }
    call('assign_role', { userId: person.id, role: choice });
  }

  return (
    <div className="side-content">
      <h3>Participants <span>{participants.length}</span></h3>
      {participants.map(person => (
        <div className="person" key={person.id}>
          <div className="avatar">{person.name[0].toUpperCase()}</div>
          <div className="person-info">
            <strong>{person.name}{person.id === userId ? ' (you)' : ''}</strong>
            <small>{person.role} · {person.online ? 'Online' : 'Away'}</small>
          </div>
          {host && person.id !== userId && (
            <select aria-label={`Manage ${person.name}`} value="" disabled={!connected} onChange={event => manage(person, event.target.value)}>
              <option value="">Manage</option>
              <option value="Moderator">Moderator</option>
              <option value="Participant">Participant</option>
              <option value="transfer" disabled={!person.online}>Transfer host</option>
              <option value="remove">Remove</option>
            </select>
          )}
        </div>
      ))}
    </div>
  );
}
