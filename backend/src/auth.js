const jwt = require('jsonwebtoken');
const prisma = require('./prisma');

function signToken(user) {
  const payload = { sub: user.id, email: user.email };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
  return token;
}

async function verifyJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'no token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    // load the user from DB and attach minimal profile
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { interests: { include: { interest: true } }, university: true } });
    if (!user) return res.status(401).json({ error: 'user not found' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'invalid token' });
  }
}

module.exports = { verifyJWT, signToken };
