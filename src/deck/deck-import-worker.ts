import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { Transport, ClientProxyFactory, ClientProxy } from '@nestjs/microservices';
import { DeckService } from './deck.service';
import { Cache } from 'cache-manager';

@Injectable()
export class DeckImportWorker implements OnModuleInit {
  private client: ClientProxy;

  constructor(
    private readonly deckService: DeckService,
    @Inject('CACHE_MANAGER') private readonly cacheManager: Cache,
  ) {}

  onModuleInit() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'], 
        queue: 'deck_import_queue',
        queueOptions: {
          durable: true,
        },
      },
    });
  }

  async listen() {
    try {
      await this.client.connect();
      console.log('Conectado ao RabbitMQ e escutando a fila "deck_import_queue"');

      this.client
        .send('deck_import_queue', {})
        .subscribe({
          next: (message) => this.processMessage(message),
          error: (err) => console.error('Erro ao processar mensagem:', err),
        });
    } catch (error) {
      console.error('Erro ao conectar ao RabbitMQ:', error);
    }
  }

  private async processMessage(message: any) {
    try {
      console.log('Mensagem recebida na fila:', message);

      if (!message || !message.userEmail || !message.deckName || !message.commanderName) {
        console.error('Mensagem inválida:', message);
        return;
      }

      const { userEmail, deckName, commanderName } = message;

      
      const newDeck = await this.deckService.create({
        name: deckName,
        commanderName,
        userEmail,
        cards: [], 
        colors: [], 
      });

      console.log('Novo deck criado a partir da fila:', newDeck);

      const cacheKey = `myDecks_${userEmail}`;
      await this.cacheManager.del(cacheKey);
    } catch (error) {
      console.error('Erro ao processar a mensagem da fila:', error);
    }
  }
}
