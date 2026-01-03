// Simple in-memory matchmaker
// Each entry: { socketId, socket, profile: { university, interests: [] }, online }
const queue = new Map();

function score(a, b) {
  const setA = new Set(a.interests || []);
  const setB = new Set(b.interests || []);
  let common = 0;
  for (const i of setA) if (setB.has(i)) common++;
  let s = common;
  if (a.university && b.university && a.university === b.university) s += 1; // bonus
  return s;
}

function findBestMatches(entry) {
  const scores = [];
  for (const [id, other] of queue) {
    if (id === entry.socketId) continue;
    if (!other.online) continue;
    scores.push({ id, score: score(entry.profile, other.profile) });
  }
  scores.sort((a, b) => b.score - a.score);
  return scores;
}

function joinQueue(socket, profile, io, onMatch) {
  const entry = { socketId: socket.id, socket, profile, online: true };
  queue.set(socket.id, entry);
  // Try to find a match among top scorers within the queue
  const scores = findBestMatches(entry);
  if (scores.length === 0) return;
  // Consider top 5 with non-zero score, else allow random small chance
  const top = scores.filter(s => s.score > 0).slice(0, 5);
  let pick;
  if (top.length > 0) {
    pick = top[Math.floor(Math.random() * top.length)];
  } else {
    // no interest overlap: pick a random available user with some probability
    const others = scores.slice(0, 10);
    pick = others.length ? others[Math.floor(Math.random() * others.length)] : null;
  }
  if (!pick) return;
  const other = queue.get(pick.id);
  if (!other) return;

  // Create a room id
  const roomId = `${entry.socketId}#${other.socketId}`;

  // Join both sockets to the room and notify
  entry.socket.join(roomId);
  other.socket.join(roomId);

  // Mark them as not online/available
  queue.delete(entry.socketId);
  queue.delete(other.socketId);

  const matchData = { roomId, peerId: other.socketId, peerProfile: other.profile, userAId: entry.socketId, userBId: other.socketId };
  io.to(entry.socketId).emit('matched', matchData);
  io.to(other.socketId).emit('matched', { ...matchData, peerId: entry.socketId, peerProfile: entry.profile, userAId: other.socketId, userBId: entry.socketId });

  // Callback with match info for client tracking and DB persistence
  if (onMatch) {
    onMatch({ roomId, matchId: `${entry.socketId}#${other.socketId}`, peerId: other.socketId, userAId: entry.socketId, userBId: other.socketId });
  }
}

function leaveQueue(socketId) {
  if (queue.has(socketId)) queue.delete(socketId);
}

module.exports = { joinQueue, leaveQueue };
