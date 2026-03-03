const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: { _count: { select: { members: true } } }
    });
    res.json(rooms);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create room
router.post('/', async (req, res) => {
  const { name, description, type } = req.body;
  if (!name) return res.status(400).json({ error: 'Room name is required' });

  try {
    const room = await prisma.room.create({
      data: {
        name,
        description,
        type: type || 'TEXT',
        members: {
          create: { userId: req.user.id, role: 'ADMIN' }
        }
      }
    });
    res.status(201).json(room);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Join room
router.post('/:id/join', async (req, res) => {
  try {
    const member = await prisma.roomMember.create({
      data: { userId: req.user.id, roomId: req.params.id }
    });
    res.json(member);
  } catch {
    res.status(400).json({ error: 'Already a member or room not found' });
  }
});

// Get room members
router.get('/:id/members', async (req, res) => {
  try {
    const members = await prisma.roomMember.findMany({
      where: { roomId: req.params.id },
      include: { user: { select: { id: true, username: true, avatar: true } } }
    });
    res.json(members);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
