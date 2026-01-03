require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const { verifyJWT, signToken } = require('./auth');
const matchmaker = require('./matchmaker');
const prisma = require('./prisma');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('ColMate backend running'));

// Basic auth endpoints (placeholders - integrate Prisma in future)
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name, university, interests } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'email already in use' });

    const hashed = await bcrypt.hash(password, 10);

    let universityId = null;
    if (university) {
      const uni = await prisma.university.upsert({ where: { name: university }, update: {}, create: { name: university } });
      universityId = uni.id;
    }

    const user = await prisma.user.create({ data: { email, password: hashed, name, universityId } });

    if (Array.isArray(interests)) {
      for (const iname of interests) {
        const it = await prisma.interest.upsert({ where: { name: iname }, update: {}, create: { name: iname } });
        await prisma.userInterest.create({ data: { userId: user.id, interestId: it.id } });
      }
    }

    const token = signToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await prisma.user.findUnique({ where: { email }, include: { interests: { include: { interest: true } }, university: true } });
    if (!user) return res.status(400).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, university: user.university, interests: user.interests.map(ui => ui.interest.name) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/me', verifyJWT, async (req, res) => {
  const user = req.user;
  // map interests
  const interests = (user.interests || []).map(ui => ui.interest.name);
  res.json({ id: user.id, email: user.email, name: user.name, university: user.university, interests });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.use(async (socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    socket.user = payload;
  } catch (err) {
    console.log('Socket auth failed:', err.message);
  }
  next();
});

// Track active matches: socketId => { roomId, matchId, peerId }
const activeMatches = new Map();

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('joinQueue', (profile) => {
    matchmaker.joinQueue(socket, profile, io, (match) => {
      activeMatches.set(socket.id, match);
    });
  });

  socket.on('sendMessage', async (data) => {
    const { roomId, content } = data;
    const match = activeMatches.get(socket.id);
    if (!match || match.roomId !== roomId) return;

    try {
      // Save message to DB using Prisma
      const msg = await prisma.message.create({
        data: {
          matchId: match.matchId,
          senderId: socket.user.sub,
          content
        }
      });
      // Broadcast to both users in the match room
      io.to(roomId).emit('messageReceived', {
        id: msg.id,
        sender: socket.user.sub,
        content,
        createdAt: msg.createdAt
      });
    } catch (err) {
      console.error('message save error:', err);
    }
  });

  socket.on('leaveQueue', () => {
    matchmaker.leaveQueue(socket.id);
  });

  socket.on('disconnect', () => {
    matchmaker.leaveQueue(socket.id);
    activeMatches.delete(socket.id);
    console.log('socket disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`ColMate backend listening on ${PORT}`));
