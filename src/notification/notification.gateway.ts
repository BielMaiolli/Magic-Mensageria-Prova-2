import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Permitir conexões de qualquer origem
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client: any) {
    console.log('Cliente conectado:', client.id);
  }

  handleDisconnect(client: any) {
    console.log('Cliente desconectado:', client.id);
  }

  sendNotification(notification: any): void {
    console.log('Tentando enviar notificação pelo WebSocket:', notification);
    this.server.emit('notification', notification);
}}