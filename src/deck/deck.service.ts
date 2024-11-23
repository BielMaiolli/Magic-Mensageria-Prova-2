import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Deck } from './schemas/deck.schema';
import * as mongoose from 'mongoose';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
@Injectable()
export class DeckService {

    constructor(
      @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
      @InjectModel(Deck.name)
      private deckModel: mongoose.Model<Deck>
    ) {}


    //mensageria
    @MessagePattern('deck_import_queue') // Nome da fila
    async handleDeckImport(@Payload() data: any): Promise<any> {
      console.log('Mensagem recebida: ', data)
      const { commanderName , deckName , userEmail } = data;

      // Simulando um delay de 5 segundos antes de processar a mensagem
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5000 milissegundos (5 segundos)

      const deck = await this.createDeckWithCommander(commanderName, deckName, userEmail);
        
      return {
          message: `Deck ${deckName} criado com sucesso para o usuário ${userEmail}`,
          deck: deck,
       };
    }


    async fetchCommander(commanderName: string): Promise<any> {
      const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(commanderName)}`;
      console.log(`Fetching commander from URL: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Response from Scryfall API:', data);
      return data;
  }


  async fetchCardsByColors(colors: string[]): Promise<string[]> {
    const colorQuery = colors.join(',');
    const response = await fetch(`https://api.scryfall.com/cards/search?q=color%3D${colorQuery}&unique=cards&order=random`);
    const data = await response.json();

    const cards: string[] = [];

    for (const card of data.data) {
       
        if (card.type_line.includes('Basic Land')) {
           
            cards.push(card.name);
            if (cards.length === 99) break;
            continue;
        }

      
        const isRepeatable = card.oracle_text && card.oracle_text.includes('A deck can have any number of cards named');
        if (!isRepeatable && cards.includes(card.name)) continue;

     
        cards.push(card.name);
        if (cards.length === 99) break;
    }

    return cards;
   }


   async createDeckWithCommander(commanderName: string, deckName: string, userEmail: string): Promise<Deck> {
   
    const commander = await this.fetchCommander(commanderName);

    if (!commander) {
        throw new NotFoundException('Comandante não encontrado');
    }

    const commanderColors = commander.colors;

    const cards = await this.fetchCardsByColors(commanderColors);

    const deck = new this.deckModel({
        name: deckName,
        commanderName: commander.name,
        colors: commanderColors,
        cards: cards,
        userEmail,
    });

    return deck.save();
   }



    async findDecksByEmail(userEmail: string): Promise<Deck[]>{
      return this.deckModel.find({ userEmail });
    }



    async findAll(): Promise<Deck[]> {
        const decks = await this.deckModel.find();
        return decks;
    }

    async create(deck: Deck): Promise<Deck> {
      const res = await this.deckModel.create(deck);
      return res;
    }

    async findById(id: string): Promise<Deck> {
      const deck = await this.deckModel.findById(id);

      if(!deck){
        throw new NotFoundException('O deck não foi encontrado');
      }

      return deck;
    }

    async updateById(id: string, deck: Deck): Promise<Deck> {
      return await this.deckModel.findByIdAndUpdate(id, deck, {
         new: true,
         runValidators: true,
      });
    }

    async deleteById(id: string): Promise<Deck> {
        return await this.deckModel.findByIdAndDelete(id);
    }
    
}
