import React from 'react';
export default function Header({ connected, session, call, clear }) {
  return <header>
    <a className="brand" href="/" onClick={e => e.preventDefault()}><span>▶</span> SyncTube<i>.</i></a>
    <div className="header-right">
      <span className="status">
        <b className={connected ? 'online' : 'offline'}/>
        {connected ? 'Connected' : 'Reconnecting'}
      </span>
      {session && <button className="quiet" onClick={() => call('leave_room', {}, clear)}>Leave room ↗</button>}
    </div>
  </header>;
}
