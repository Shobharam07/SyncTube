import React, { useState } from 'react';
import { format } from '../utils/room.js';

export default function PlaybackControls({ state, time, duration, connected, control, action }) {
  const [seconds, setSeconds] = useState('');
  const [draft, setDraft] = useState(null);
  const disabled = !connected || !state.videoId;
  const position = Math.min(duration || 86400, Math.max(0, draft ?? time));

  function submitSeek(event) {
    event.preventDefault();
    if (seconds.trim()) action('seek', Number(seconds));
    setSeconds('');
  }

  function commitSeek(value) {
    if (draft !== null) action('seek', Number(value));
    setDraft(null);
  }

  return (
    <>
      {duration > 0 && (
        <div className="timeline">
          <input
            type="range"
            aria-label={control ? 'Seek video' : 'Request seek'}
            min="0"
            max={duration}
            step="1"
            value={position}
            disabled={disabled}
            onChange={event => setDraft(Number(event.target.value))}
            onPointerUp={event => commitSeek(event.currentTarget.value)}
            onKeyUp={event => commitSeek(event.currentTarget.value)}
            onBlur={event => commitSeek(event.currentTarget.value)}
          />
          <small>{format(position)} / {format(duration)}</small>
        </div>
      )}
      <div className="controlbar">
        <button className="primary" disabled={disabled} onClick={() => action(state.playing ? 'pause' : 'play')}>
          {control ? '' : 'Request '}{state.playing ? 'Pause' : 'Play'}
        </button>
        <span className="time">{format(position)}</span>
        <form className="seek" onSubmit={submitSeek}>
          <input aria-label="Seek seconds" type="number" min="0" max={duration || 86400} placeholder="Seconds" value={seconds} onChange={event => setSeconds(event.target.value)} />
          <button className="secondary" disabled={disabled}>{control ? 'Seek' : 'Request seek'}</button>
        </form>
        <span className="sync-label">{connected ? 'Live sync' : 'Offline'}</span>
      </div>
      <div className="panel-bottom">
        {control ? 'You can control playback for everyone.' : 'Playback changes require host or moderator approval.'}
      </div>
    </>
  );
}
