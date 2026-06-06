import { Server } from 'socket.io';

let io: Server;

export const initializeWebSocket = (server: any) => {
  io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket: any) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

export const broadcastEvent = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
  }
};
