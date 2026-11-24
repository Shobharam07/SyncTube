import React from 'react';
import Participants from './Participants.jsx';
import RoomChat from './RoomChat.jsx';
import RequestPanel from './RequestPanel.jsx';

export default function RoomSidebar({ tab, setTab, room, session, host, control, call, chat, setChat, connected }) {
  const tabs = [
    { id: 'people', label: 'People' },
    { id: 'chat', label: 'Chat' },
    { id: 'requests', label: `Requests (${room.requests.length})` }
  ];

  return (
    <aside className="panel sidebar">
      <div className="tabs">
        {tabs.map(item => (
          <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'people' && <Participants participants={room.participants} userId={session.userId} {...{ host, connected, call }} />}
      {tab === 'chat' && <RoomChat messages={room.messages} {...{ chat, setChat, connected, call }} />}
      {tab === 'requests' && <RequestPanel requests={room.requests} {...{ control, connected, call }} />}
    </aside>
  );
}
