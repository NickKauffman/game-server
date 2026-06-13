const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static('public'));

const rooms = {};

function generateCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('connected:', socket.id);

  socket.on('create-room', () => {
    const code = generateCode();
    rooms[code] = { host: socket.id, players: [] };
    socket.join(code);
    socket.emit('room-created', code);
    console.log('room created:', code);
  });

  socket.on('join-room', ({ code, name }) => {
    const room = rooms[code];
    if (!room) return socket.emit('error', 'Room not found');
    room.players.push({ id: socket.id, name });
    socket.join(code);
    socket.emit('joined', { code, name });
    io.to(room.host).emit('player-joined', { id: socket.id, name });
    console.log(name, 'joined room:', code);
  });

  socket.on('button-press', ({ code, button }) => {
    const room = rooms[code];
    if (!room) return;
    io.to(room.host).emit('button-press', { id: socket.id, button });
  });

  socket.on('disconnect', () => {
    console.log('disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port', PORT));
