import { io } from 'socket.io-client';
import { getToken } from './auth';

let socket = null;

export const connectSocket = () => {
  const token = getToken();
  socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001', { auth: { token } });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};
