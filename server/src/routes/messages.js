const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get messages for a room
router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const { limit = 50, before } = req.query;

  try {
    const messages = await prisma.message.findMany({
      where: {
        roomId,
        ...(before && { createdAt: { lt: new Date(before) } })
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });
    res.json(messages.reverse());
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
