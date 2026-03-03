import { useState } from 'react';
import api from '../utils/api';
import { saveAuth } from '../utils/auth';
import styles from '../styles/Auth.module.css';

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, form);
      saveAuth(data.token, data.user);
      onAuth(data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>Discord Clone</h1>
        <h2 className={styles.subtitle}>
          {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
        </h2>

        {mode === 'register' && (
          <input
            className={styles.input}
            name="username"
            placeholder="Kullanıcı adı"
            value={form.username}
            onChange={handle}
          />
        )}
        <input
          className={styles.input}
          name="email"
          type="email"
          placeholder="E-posta"
          value={form.email}
          onChange={handle}
        />
        <input
          className={styles.input}
          name="password"
          type="password"
          placeholder="Şifre"
          value={form.password}
          onChange={handle}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.btn} onClick={submit} disabled={loading}>
          {loading ? 'Yükleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
        </button>

        <p className={styles.toggle}>
          {mode === 'login' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
          <span onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? ' Kayıt Ol' : ' Giriş Yap'}
          </span>
        </p>
      </div>
    </div>
  );
}
