import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import Chat from '../components/Chat/Chat';
import { connectSocket, disconnectSocket } from '../utils/socket';
import { clearAuth } from '../utils/auth';
import styles from '../styles/Main.module.css';

export default function MainPage({ user, onLogout }) {
  const [activeRoom, setActiveRoom] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = connectSocket();
    setSocket(s);
    return () => disconnectSocket();
  }, []);

  const logout = () => {
    clearAuth();
    disconnectSocket();
    onLogout();
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        user={user}
        socket={socket}
        activeRoom={activeRoom}
        onSelectRoom={setActiveRoom}
        onLogout={logout}
      />
      <main className={styles.main}>
        {activeRoom ? (
          <Chat room={activeRoom} user={user} socket={socket} />
        ) : (
          <div className={styles.empty}>
            <p>Bir oda seç veya oluştur</p>
          </div>
        )}
      </main>
    </div>
  );
}
