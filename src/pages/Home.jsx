import React from 'react';
export default function Home({ name, setName, code, setCode, busy, connected, enter }) {
  return <main className="landing">
    <div className="intro">
      <div className="eyebrow">● THE SHARED VIEWING EXPERIENCE</div>
      <h1>Different places.<br /><em>Same moment.</em></h1>
      <p>Watch YouTube with friends, wherever they are. One room, perfectly shared controls and conversations in real time.</p>
      <div className="features">
        <span>↻ Live sync</span>
        <span>♙ Room roles</span>
        <span>✉ Live chat</span>
      </div>
    </div>
    <section className="entry panel">
      <div className="eyebrow">YOUR WATCH PARTY</div>
      <h2>Make it a movie night.</h2>
      <label>Display name<input maxLength={32} placeholder="Your name" value={name} onChange={e => setName(e.target.value)}/></label>
      <button className="primary full" disabled={busy || !connected} onClick={() => enter(true)}>Create a room <span>＋</span></button>
      <div className="or">or join a friend</div>
      <label>Room code<input placeholder="Enter invite code" value={code} onChange={e => setCode(e.target.value.toUpperCase())}/></label>
      <button className="secondary full" disabled={busy || !connected} onClick={() => enter(false)}>Join room <span>→</span></button>
      <small>No account required · Free to join</small>
    </section>
  </main>;
}
