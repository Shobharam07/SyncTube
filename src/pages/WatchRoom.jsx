import React, { useState } from 'react';
import VideoPlayer from '../components/VideoPlayer.jsx';
import RoomSidebar from '../components/RoomSidebar.jsx';
import PlaybackControls from '../components/PlaybackControls.jsx';

export default function WatchRoom({ room, session, role, control, host, state, setNotice, connected, action, time, url, setUrl, load, copy, tab, setTab, call, chat, setChat }) {
  const [duration, setDuration] = useState(0);
  const onlineCount = room.participants.filter(person => person.online).length;

  return (
    <main className="workspace">
      <section className="room-heading">
        <div>
          <div className="eyebrow">YOUR PRIVATE WATCH PARTY</div>
          <h1>Watch together<span>.</span></h1>
          <p>Room <strong>{room.id}</strong> · {onlineCount} online</p>
        </div>
        <button className="secondary" onClick={copy}>Copy invite link</button>
      </section>
      <div className="layout">
        <section className="video-column">
          <div className="panel video-panel">
            <div className="panel-top">
              <span><b className={connected ? 'online' : 'offline'} /> LIVE ROOM</span>
              <span className="role">{role}</span>
            </div>
            <VideoPlayer state={state} onNotice={setNotice} onDuration={setDuration} />
            <PlaybackControls key={state.videoId} {...{ state, time, duration, connected, control, action }} />
          </div>
          <form className="panel load" onSubmit={load}>
            <label>Change YouTube video
              <input value={url} onChange={event => setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
            </label>
            <button className="primary" disabled={!connected}>{control ? 'Load video' : 'Request video'}</button>
          </form>
          <div className="note"><b>Stay in sync.</b> The room automatically resynchronizes playback. YouTube may require a click to enable playback.</div>
        </section>
        <RoomSidebar {...{ tab, setTab, room, session, host, control, call, chat, setChat, connected }} />
      </div>
    </main>
  );
}
