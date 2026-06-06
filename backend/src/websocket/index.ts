import { Server } from 'socket.io';

let io;

export const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

export const broadcastEvent = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};
