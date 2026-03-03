import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from '../../styles/Sidebar.module.css';

export default function Sidebar({ user, socket, activeRoom, onSelectRoom, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', type: 'TEXT' });
  const [voiceParticipants, setVoiceParticipants] = useState({}); // { roomId: [{userId, username, socketId}] }
  const [connectedVoiceRoom, setConnectedVoiceRoom] = useState(null);

  useEffect(() => {
    api.get('/rooms').then(({ data }) => setRooms(data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('room_created', (room) => setRooms(prev => [...prev, room]));

    // Yeni biri katıldı
    socket.on('voice_user_joined', ({ userId, username, socketId, roomId }) => {
      setVoiceParticipants(prev => {
        const current = prev[roomId] || [];
        if (current.find(p => p.socketId === socketId)) return prev;
        return { ...prev, [roomId]: [...current, { userId, username, socketId }] };
      });
    });

    // Biri ayrıldı
    socket.on('voice_user_left', ({ socketId, roomId }) => {
      setVoiceParticipants(prev => ({
        ...prev,
        [roomId]: (prev[roomId] || []).filter(p => p.socketId !== socketId)
      }));
    });

    // Odaya katılınca mevcut üye listesi geldi
    socket.on('voice_room_members', ({ roomId, members }) => {
      setVoiceParticipants(prev => ({ ...prev, [roomId]: members }));
    });

    return () => {
      socket.off('room_created');
      socket.off('voice_user_joined');
      socket.off('voice_user_left');
      socket.off('voice_room_members');
    };
  }, [socket]);

  const createRoom = async () => {
    if (!newRoom.name.trim()) return;
    try {
      const { data } = await api.post('/rooms', newRoom);
      setRooms(prev => [...prev, data]);
      setCreating(false);
      setNewRoom({ name: '', type: 'TEXT' });
    } catch (err) {
      console.error(err);
    }
  };

  const joinAndSelect = async (room) => {
    try { await api.post(`/rooms/${room.id}/join`); } catch {}
    if (socket) socket.emit('join_room', room.id);
    if (room.type === 'VOICE') {
      setConnectedVoiceRoom(room.id);
      if (socket) socket.emit('voice_join', room.id);
    }
    onSelectRoom(room);
  };

  const textRooms = rooms.filter(r => r.type === 'TEXT');
  const voiceRooms = rooms.filter(r => r.type === 'VOICE');

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2>Discord Clone</h2>
        <button className={styles.iconBtn} onClick={() => setCreating(!creating)} title="Oda Oluştur">+</button>
      </div>

      {creating && (
        <div className={styles.createForm}>
          <input
            placeholder="Oda adı"
            value={newRoom.name}
            onChange={e => setNewRoom({ ...newRoom, name: e.target.value })}
            className={styles.input}
          />
          <select
            value={newRoom.type}
            onChange={e => setNewRoom({ ...newRoom, type: e.target.value })}
            className={styles.select}
          >
            <option value="TEXT">Metin</option>
            <option value="VOICE">Ses</option>
          </select>
          <button className={styles.createBtn} onClick={createRoom}>Oluştur</button>
        </div>
      )}

      <div className={styles.roomList}>
        {textRooms.length > 0 && <p className={styles.sectionTitle}>METİN ODALARI</p>}
        {textRooms.map(room => (
          <div
            key={room.id}
            className={`${styles.roomItem} ${activeRoom?.id === room.id ? styles.active : ''}`}
            onClick={() => joinAndSelect(room)}
          >
            <span className={styles.roomIcon}>#</span>
            <span className={styles.roomName}>{room.name}</span>
          </div>
        ))}

        {voiceRooms.length > 0 && <p className={styles.sectionTitle}>SES ODALARI</p>}
        {voiceRooms.map(room => (
          <div key={room.id}>
            <div
              className={`${styles.roomItem} ${activeRoom?.id === room.id ? styles.active : ''}`}
              onClick={() => joinAndSelect(room)}
            >
              <span className={styles.roomIcon}>🔊</span>
              <span className={styles.roomName}>{room.name}</span>
            </div>

            {/* Kendim */}
            {connectedVoiceRoom === room.id && (
              <div className={styles.voiceMember}>
                <div className={styles.memberAvatar}>{user.username[0].toUpperCase()}</div>
                <span>{user.username}</span>
              </div>
            )}

            {/* Diğerleri */}
            {(voiceParticipants[room.id] || []).map((p) => (
              <div key={p.socketId} className={styles.voiceMember}>
                <div className={styles.memberAvatar}>{p.username[0].toUpperCase()}</div>
                <span>{p.username}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.userBar}>
        <div className={styles.avatar}>{user.username[0].toUpperCase()}</div>
        <span className={styles.username}>{user.username}</span>
        <button className={styles.logoutBtn} onClick={onLogout} title="Çıkış">✕</button>
      </div>
    </aside>
  );
}
