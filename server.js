const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // allow extension connections
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a room using the 6-digit code
    socket.on('join-room', (roomId, role) => {
        socket.join(roomId);
        socket.roomId = roomId; // store for disconnect
        socket.role = role;     // 'host' or 'helper'
        console.log(`Socket ${socket.id} joined room ${roomId} as ${role}`);

        // Notify others in the room
        socket.to(roomId).emit('user-joined', role);
    });

    // Relay WebRTC signaling messages
    socket.on('signal', (data) => {
        // data should contain { roomId, signalData }
        socket.to(data.roomId).emit('signal', data.signalData);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        if (socket.roomId) {
            socket.to(socket.roomId).emit('user-left', socket.role);
        }
    });
});

// Basic Health Check Route
app.get('/', (req, res) => {
    res.send('<h1>Fawn Signaling Server is awake and running!</h1><p>The WebRTC socket is ready for connections.</p>');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Fawn Signaling Server listening on port ${PORT}`);
});
