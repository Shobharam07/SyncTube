import React, { useEffect, useRef } from 'react';

export default function RoomChat({ messages, chat, setChat, connected, call }) {
  const list = useRef(null);

  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [messages]);

  function send(event) {
    event.preventDefault();
    if (chat.trim()) call('chat', { text: chat }, () => setChat(''));
  }

  return (
    <div className="side-content chat">
      <h3>Room chat</h3>
      <div className="messages" ref={list}>
        {messages.length === 0 && <p className="muted">Start the conversation.</p>}
        {messages.map(message => (
          <div className="message" key={message.id}>
            <strong>{message.name}</strong>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <form onSubmit={send}>
        <input aria-label="Chat message" maxLength={500} placeholder="Say something..." value={chat} onChange={event => setChat(event.target.value)} />
        <button className="primary" disabled={!connected || !chat.trim()}>Send</button>
      </form>
    </div>
  );
}
