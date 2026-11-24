import React from 'react';
import { format } from '../utils/room.js';

function requestLabel(request) {
  switch (request.action) {
    case 'seek': return `Seek to ${format(request.value)}`;
    case 'change_video': return `Change video to ${request.value}`;
    case 'play': return 'Play the video';
    case 'pause': return 'Pause the video';
    default: return 'Playback change';
  }
}

export default function RequestPanel({ requests, control, connected, call }) {
  function decide(id, approve) {
    call('resolve_request', { id, approve });
  }

  return (
    <div className="side-content">
      <h3>Playback requests</h3>
      {!requests.length && <p className="muted">No pending requests.</p>}
      {requests.map(request => (
        <div className="request" key={request.id}>
          <strong>{request.name}</strong>
          <p>{requestLabel(request)}</p>
          {control ? (
            <div>
              <button className="primary" disabled={!connected} onClick={() => decide(request.id, true)}>Approve</button>
              <button className="secondary" disabled={!connected} onClick={() => decide(request.id, false)}>Reject</button>
            </div>
          ) : <small className="muted">Awaiting approval</small>}
        </div>
      ))}
    </div>
  );
}
