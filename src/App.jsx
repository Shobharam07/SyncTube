import React, { useState, useEffect, useRef } from 'react';
import { socket } from './services/socket.js';
import { initial, readSession, extractId } from './utils/room.js';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';
import WatchRoom from './pages/WatchRoom.jsx';
export default function App() {
  const [session, setSession] = useState(readSession);
  const sessionRef = useRef(session);
  const [room, setRoom] = useState(null);
  const [state, setState] = useState(initial);
  const [connected, setConnected] = useState(socket.connected);
  const [name, setName] = useState('');
  const [code, setCode] = useState(new URLSearchParams(location.search).get('room') || '');
  const [url, setUrl] = useState('');
  const [chat, setChat] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('people');
  const [, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  sessionRef.current = session;
  const receive = s => setState({ ...s, receivedAt: Date.now() });
  const save = s => {
    sessionRef.current = s;
    setSession(s);
    if (s) {
      sessionStorage.setItem('synctube-session', JSON.stringify(s));
    } else {
      sessionStorage.removeItem('synctube-session');
    }
  };
  const clear = () => {
    save(null);
    setRoom(null);
    setTab('people');
    setCode('');
    setChat('');
    setUrl('');
    setState(initial);
    history.replaceState({}, '', location.pathname);
  };
  const call = (event, data = {}, success) => {
    if (!socket.connected) {
      setNotice('Connection unavailable. Reconnecting...');
      setBusy(false);
      return;
    }
    socket.timeout(7000).emit(event, data, (err, res) => {
      setBusy(false);
      if (err || !res?.ok) {
        setNotice(res?.error || 'Request timed out');
        return;
      }
      success?.(res);
    });
  };
  useEffect(() => {
    const connect = () => {
      setConnected(true);
      const s = sessionRef.current;
      if (s) {
        socket.timeout(7000).emit('join_room', { roomId: s.roomId, token: s.token }, (err, res) => {
        if (err) {
          setNotice('Reconnect timed out. Refresh to retry.');
          return;
        }
        if (!res?.ok) {
          clear();
          setNotice(res?.error || 'Session expired');
        }
        });
      }
    };
    const disconnect = () => setConnected(false);
    const update = r => {
      setRoom(r);
      receive(r.state);
    };
    const removed = msg => {
      clear();
      setNotice(msg);
    };
    const messages = m => setRoom(r => r ? { ...r, messages: m } : r);
    socket.on('connect', connect);
    socket.on('disconnect', disconnect);
    socket.on('room_update', update);
    socket.on('sync_state', receive);
    socket.on('removed', removed);
    socket.on('notice', setNotice);
    socket.on('chat_update', messages);
    if (socket.connected) connect();
    return () => {
      socket.off('connect', connect);
      socket.off('disconnect', disconnect);
      socket.off('room_update', update);
      socket.off('sync_state', receive);
      socket.off('removed', removed);
      socket.off('notice', setNotice);
      socket.off('chat_update', messages);
    };
  }, []);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (notice) {
      const id = setTimeout(() => setNotice(''), 6000);
      return () => clearTimeout(id);
    }
  }, [notice]);
  const role = room?.participants.find(person => person.id === session?.userId)?.role;
  const control = ['Host', 'Moderator'].includes(role);
  const host = role === 'Host';
  const time = state.time + (state.playing ? Math.max(0, Date.now() - (state.receivedAt || Date.now())) / 1000 : 0);
  const enter = create => {
    if (!name.trim()) {
      setNotice('Enter your display name');
      return;
    }
    if (!create && !code.trim()) {
      setNotice('Enter a room code');
      return;
    }
    setBusy(true);
    call(create ? 'create_room' : 'join_room', { name, roomId: code.trim() }, res => {
      save(res);
      history.replaceState({}, '', `?room=${res.roomId}`);
    });
  };
  const action = (action, value) => {
    if (!state.videoId && action !== 'change_video') {
      setNotice('Load a video first');
      return;
    }
    call(control ? action : 'request_action', control ? { value } : { action, value }, () => {
      if (!control) {
        setNotice('Request sent for approval');
        setTab('requests');
      }
    });
  };
  const load = e => {
    e.preventDefault();
    const id = extractId(url);
    if (!id) {
      setNotice('Enter a valid YouTube URL or video ID');
      return;
    }
    action('change_video', id);
    setUrl('');
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/?room=${room.id}`);
      setNotice('Invite link copied');
    }
    catch {
      setNotice(`Room code: ${room.id}`);
    }
  };
  return <>
    <Header {...{ connected, session, call, clear }}/>
    {notice && <div className="toast" role="status">
      {notice}
      <button onClick={() => setNotice('')}>×</button>
    </div>}
    {!session ? <Home {...{ name, setName, code, setCode, busy, connected, enter }}/> : room ? <WatchRoom {...{ room, session, role, control, host, state, setNotice, connected, action, time, url, setUrl, load, copy, tab, setTab, call, chat, setChat }}/> : <main className="loading">Restoring your room… <button className="secondary" onClick={() => { if (socket.connected) call('leave_room', {}, clear); else clear(); }}>Return home</button></main>}
    <footer>SyncTube <span>•</span> Watch together, wherever you are.</footer>
  </>;
}
