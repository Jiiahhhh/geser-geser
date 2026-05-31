const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup to allow frontend connection
app.use(cors({
  origin: '*', // In production, replace with specific frontend URL
  methods: ['GET', 'POST']
}));

app.use(express.json());

// REST Endpoint: Create Room
app.get('/create-room', (req, res) => {
  // Generate random 5-digit PIN
  const roomPin = Math.floor(10000 + Math.random() * 90000).toString();
  console.log(`[Room Created] PIN: ${roomPin}`);
  res.json({ roomPin });
});

const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`[Connected] Socket ID: ${socket.id}`);

  // Phase 1: Join Room
  socket.on('join-room', (pin) => {
    if (!pin) return;
    
    socket.join(pin);
    console.log(`[Join] Socket ${socket.id} joined room ${pin}`);

    const room = io.sockets.adapter.rooms.get(pin);
    const numClients = room ? room.size : 0;

    // If there are at least 2 clients in the room, notify everyone to start the game
    if (numClients >= 2) {
      io.to(pin).emit('partner-joined', { message: 'Partner connected!' });
      console.log(`[Room Ready] Room ${pin} is now active with ${numClients} users.`);
    }
  });

  // Phase 2: Slide Meme
  socket.on('slide-meme', (data) => {
    // Expected data: { pin: "12345", memeUrl: "link.jpg", direction: "right" }
    if (!data || !data.pin) return;

    console.log(`[Slide] Room ${data.pin} from Socket ${socket.id}: ${data.direction}`);
    
    // Broadcast to everyone in the room except the sender
    socket.to(data.pin).emit('receive-meme', {
      memeUrl: data.memeUrl,
      direction: data.direction
    });
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    console.log(`[Disconnected] Socket ID: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
