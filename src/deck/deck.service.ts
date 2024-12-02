import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Deck } from './schemas/deck.schema';
import * as mongoose from 'mongoose';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class DeckService {
  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
    @InjectModel(Deck.name) private deckModel: mongoose.Model<Deck>,
    private readonly notificationGateway: NotificationGateway, // Gateway para WebSocket
  ) {}

  @MessagePattern('deck_import_queue') // Nome da fila
  @MessagePattern('deck_import_queue') // Nome da fila
  async handleDeckImport(@Payload() data: any): Promise<any> {
      console.log('Mensagem recebida para importação:', data);
  
      const { commanderName, deckName, userEmail } = data;
  
      if (!commanderName || !deckName || !userEmail) {
          console.error('Dados faltando na mensagem:', data);
          throw new Error('Dados faltando para processar a importação do deck.');
      }
  
      try {
          console.log('Iniciando criação do deck...');
          const deck = await this.createDeckWithCommander(commanderName, deckName, userEmail);
          console.log('Deck criado com sucesso:', deck);
  
          // Notificação de sucesso
          this.notificationGateway.sendNotification({
              userEmail,
              deckName,
              status: 'Importação concluída',
          });
  
          console.log('Notificação enviada com sucesso');
          return {
              message: `Deck ${deckName} criado com sucesso para o usuário ${userEmail}`,
              deck,
          };
      } catch (error) {
          console.error('Erro ao processar a mensagem:', error.message);
  
          // Notificação de falha
          this.notificationGateway.sendNotification({
              userEmail,
              deckName,
              status: 'Falha na importação do deck',
          });
  
          throw error;
      }
  }
  


  async fetchCommander(commanderName: string): Promise<any> {
    const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(commanderName)}`;
    console.log(`Fetching commander from URL: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao buscar comandante: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Response from Scryfall API:', data);
    return data;
  }

  async fetchCardsByColors(colors: string[]): Promise<string[]> {
    const colorQuery = colors.join(',');
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=color%3D${colorQuery}&unique=cards&order=random`,
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar cartas: ${response.statusText}`);
    }

    const data = await response.json();
    const cards: string[] = [];

    for (const card of data.data) {
      if (card.type_line.includes('Basic Land')) {
        cards.push(card.name);
        if (cards.length === 99) break;
        continue;
      }

      const isRepeatable =
        card.oracle_text && card.oracle_text.includes('A deck can have any number of cards named');
      if (!isRepeatable && cards.includes(card.name)) continue;

      cards.push(card.name);
      if (cards.length === 99) break;
    }

    return cards;
  }

  async createDeckWithCommander(commanderName: string, deckName: string, userEmail: string): Promise<Deck> {
    console.log('Buscando dados do comandante:', commanderName);
    const commander = await this.fetchCommander(commanderName);

    if (!commander) {
        console.error('Comandante não encontrado:', commanderName);
        throw new NotFoundException('Comandante não encontrado');
    }

    console.log('Gerando lista de cartas...');
    const cards = await this.fetchCardsByColors(commander.colors);
    console.log('Lista de cartas gerada com sucesso');

    const deck = new this.deckModel({
        name: deckName,
        commanderName: commander.name,
        colors: commander.colors,
        cards,
        userEmail,
    });

    console.log('Salvando deck no banco de dados...');
    return deck.save();
}


  async findDecksByEmail(userEmail: string): Promise<Deck[]> {
    return this.deckModel.find({ userEmail });
  }

  async findAll(): Promise<Deck[]> {
    return this.deckModel.find();
  }

  async create(deck: Deck): Promise<Deck> {
    return this.deckModel.create(deck);
  }

  async findById(id: string): Promise<Deck> {
    const deck = await this.deckModel.findById(id);

    if (!deck) {
      throw new NotFoundException('O deck não foi encontrado');
    }

    return deck;
  }

  async updateById(id: string, deck: Deck): Promise<Deck> {
    return this.deckModel.findByIdAndUpdate(id, deck, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id: string): Promise<Deck> {
    return this.deckModel.findByIdAndDelete(id);
  }
}
