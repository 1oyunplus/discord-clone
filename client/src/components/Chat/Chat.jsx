import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import styles from '../../styles/Chat.module.css';

export default function Chat({ room, user, socket }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/messages/${room.id}`)
      .then(({ data }) => setMessages(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [room.id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_room', room.id);
    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => {
      socket.off('new_message');
    };
  }, [socket, room.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim() || !socket) return;
    socket.emit('send_message', { roomId: room.id, content: input });
    setInput('');
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const fmt = (d) => new Date(d).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={styles.chat}>
      <div className={styles.header}>
        <span># {room.name}</span>
      </div>
      <div className={styles.messages}>
        {messages.map(msg => (
          <div key={msg.id} className={styles.message}>
            <div className={styles.avatar}>{msg.user.username[0].toUpperCase()}</div>
            <div className={styles.content}>
              <div className={styles.meta}>
                <span className={styles.name}>{msg.user.username}</span>
                <span className={styles.time}>{fmt(msg.createdAt)}</span>
              </div>
              <p className={styles.text}>{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className={styles.inputArea}>
        <input
          className={styles.input}
          placeholder={`#${room.name} kanalına mesaj gönder`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
        />
        <button className={styles.sendBtn} onClick={send}>➤</button>
      </div>
    </div>
  );
}
