import { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import MainPage from './pages/MainPage';
import { getToken, getUser } from './utils/auth';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const savedUser = getUser();
    if (token && savedUser) setUser(savedUser);
    setLoading(false);
  }, []);

  if (loading) return <div style={{ background: '#1e1f22', height: '100vh' }} />;

  return user
    ? <MainPage user={user} onLogout={() => setUser(null)} />
    : <AuthPage onAuth={setUser} />;
}
