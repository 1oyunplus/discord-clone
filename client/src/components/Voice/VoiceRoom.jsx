import { useState, useEffect, useRef } from 'react';
import styles from '../../styles/Voice.module.css';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export default function VoiceRoom({ room, user, socket }) {
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [muted, setMuted] = useState(false);
  const localStream = useRef(null);
  const peers = useRef({});
  const audioRefs = useRef({});

  const createPeer = (targetId, stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit('webrtc_ice_candidate', { candidate, targetId });
    };

    pc.ontrack = ({ streams }) => {
      const audio = audioRefs.current[targetId] || new Audio();
      audio.srcObject = streams[0];
      audio.play().catch(() => {});
      audioRefs.current[targetId] = audio;
    };

    return pc;
  };

  const joinVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.current = stream;
      socket.emit('voice_join', room.id);
      setConnected(true);
    } catch {
      alert('Mikrofon erişimi reddedildi.');
    }
  };

  const leaveVoice = () => {
    localStream.current?.getTracks().forEach(t => t.stop());
    Object.values(peers.current).forEach(pc => pc.close());
    peers.current = {};
    socket.emit('voice_leave', room.id);
    setConnected(false);
    setParticipants([]);
  };

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(t => { t.enabled = muted; });
      setMuted(!muted);
    }
  };

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on('voice_user_joined', async ({ userId, username, socketId }) => {
      setParticipants(prev => [...prev, { userId, username, socketId }]);
      const pc = createPeer(socketId, localStream.current);
      peers.current[socketId] = pc;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc_offer', { roomId: room.id, offer, targetId: socketId });
    });

    socket.on('webrtc_offer', async ({ offer, from }) => {
      const pc = createPeer(from, localStream.current);
      peers.current[from] = pc;
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc_answer', { answer, targetId: from });
    });

    socket.on('webrtc_answer', async ({ answer, from }) => {
      await peers.current[from]?.setRemoteDescription(answer);
    });

    socket.on('webrtc_ice_candidate', async ({ candidate, from }) => {
      await peers.current[from]?.addIceCandidate(candidate);
    });

    socket.on('voice_user_left', ({ userId }) => {
      setParticipants(prev => prev.filter(p => p.userId !== userId));
    });

    return () => {
      socket.off('voice_user_joined');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
      socket.off('voice_user_left');
    };
  }, [socket, connected]);

  return (
    <div className={styles.voice}>
      <div className={styles.layout}>
        {/* Sol panel - katılımcılar */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>🔊 {room.name}</div>
          <div className={styles.participants}>
            {connected && (
              <div className={styles.participant}>
                <div className={styles.avatar}>{user.username[0].toUpperCase()}</div>
                <span className={styles.name}>{user.username} <span className={styles.you}>(sen)</span></span>
                {muted && <span className={styles.muteIcon}>🔇</span>}
              </div>
            )}
            {participants.map(p => (
              <div key={p.socketId} className={styles.participant}>
                <div className={styles.avatar}>{p.username[0].toUpperCase()}</div>
                <span className={styles.name}>{p.username}</span>
              </div>
            ))}
          </div>
          <div className={styles.controls}>
            {!connected ? (
              <button className={styles.joinBtn} onClick={joinVoice}>🎤 Katıl</button>
            ) : (
              <>
                <button className={styles.muteBtn} onClick={toggleMute}>
                  {muted ? '🔇' : '🎤'}
                </button>
                <button className={styles.leaveBtn} onClick={leaveVoice}>📵 Ayrıl</button>
              </>
            )}
          </div>
        </div>

        {/* Sağ alan - boş/gelecekte video vs */}
        <div className={styles.content}>
          <p className={styles.hint}>
            {connected ? `${participants.length + 1} kişi bağlı` : 'Ses odasına katılmak için butona bas'}
          </p>
        </div>
      </div>
    </div>
  );
}
