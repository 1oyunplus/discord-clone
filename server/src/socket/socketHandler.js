const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Bellekte ses odası katılımcılarını tut
const voiceRooms = {}; // { roomId: [ { userId, username, socketId } ] }

const setupSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
    });

    socket.on('send_message', async ({ roomId, content }) => {
      if (!content?.trim()) return;
      try {
        const message = await prisma.message.create({
          data: { content, userId: socket.user.id, roomId },
          include: { user: { select: { id: true, username: true, avatar: true } } }
        });
        io.to(roomId).emit('new_message', message);
      } catch {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // WebRTC Signaling
    socket.on('webrtc_offer', ({ roomId, offer, targetId }) => {
      socket.to(targetId || roomId).emit('webrtc_offer', {
        offer, from: socket.user.id, username: socket.user.username
      });
    });

    socket.on('webrtc_answer', ({ answer, targetId }) => {
      socket.to(targetId).emit('webrtc_answer', { answer, from: socket.user.id });
    });

    socket.on('webrtc_ice_candidate', ({ candidate, targetId }) => {
      socket.to(targetId).emit('webrtc_ice_candidate', { candidate, from: socket.user.id });
    });

    // Ses odası - katıl
    socket.on('voice_join', (roomId) => {
      if (!voiceRooms[roomId]) voiceRooms[roomId] = [];

      // Zaten listede varsa ekleme
      const alreadyIn = voiceRooms[roomId].find(p => p.socketId === socket.id);
      if (!alreadyIn) {
        voiceRooms[roomId].push({
          userId: socket.user.id,
          username: socket.user.username,
          socketId: socket.id
        });
      }

      socket.join(`voice:${roomId}`);

      // Odadaki herkese yeni kişiyi bildir (roomId ile birlikte)
      socket.to(`voice:${roomId}`).emit('voice_user_joined', {
        userId: socket.user.id,
        username: socket.user.username,
        socketId: socket.id,
        roomId
      });

      // Yeni katılan kişiye mevcut listeyi gönder
      socket.emit('voice_room_members', {
        roomId,
        members: voiceRooms[roomId].filter(p => p.socketId !== socket.id)
      });
    });

    // Ses odası - ayrıl
    socket.on('voice_leave', (roomId) => {
      if (voiceRooms[roomId]) {
        voiceRooms[roomId] = voiceRooms[roomId].filter(p => p.socketId !== socket.id);
      }
      socket.leave(`voice:${roomId}`);
      io.to(`voice:${roomId}`).emit('voice_user_left', {
        userId: socket.user.id,
        socketId: socket.id,
        roomId
      });
    });

    // Bağlantı kesilince ses odalarından çıkar
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
      Object.keys(voiceRooms).forEach(roomId => {
        const before = voiceRooms[roomId].length;
        voiceRooms[roomId] = voiceRooms[roomId].filter(p => p.socketId !== socket.id);
        if (voiceRooms[roomId].length < before) {
          io.to(`voice:${roomId}`).emit('voice_user_left', {
            userId: socket.user.id,
            socketId: socket.id,
            roomId
          });
        }
      });
    });
  });
};

module.exports = { setupSocket };
