import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';

@Module({
  providers: [NotificationGateway],
  exports: [NotificationGateway], // Exportar o NotificationGateway para outros módulos
})
export class NotificationModule {}
