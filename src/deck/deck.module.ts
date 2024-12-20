import { Module } from '@nestjs/common';
import { DeckController } from './deck.controller';
import { DeckService } from './deck.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DeckSchema } from './schemas/deck.schema';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { RabbitMQModule } from 'src/common/rabbitmq.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    CacheModule.register({
      ttl: 10,
      max: 100,
    }),
    AuthModule,
    RabbitMQModule,
    NotificationModule, // Importa corretamente o NotificationModule
    MongooseModule.forFeature([{ name: 'Deck', schema: DeckSchema }]),
  ],
  controllers: [DeckController],
  providers: [DeckService],
})
export class DeckModule {}
