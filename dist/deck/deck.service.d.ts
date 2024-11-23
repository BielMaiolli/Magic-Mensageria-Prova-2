import { Deck } from './schemas/deck.schema';
import * as mongoose from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
export declare class DeckService {
    private readonly client;
    private deckModel;
    constructor(client: ClientProxy, deckModel: mongoose.Model<Deck>);
    handleDeckImport(data: any): Promise<any>;
    fetchCommander(commanderName: string): Promise<any>;
    fetchCardsByColors(colors: string[]): Promise<string[]>;
    createDeckWithCommander(commanderName: string, deckName: string, userEmail: string): Promise<Deck>;
    findDecksByEmail(userEmail: string): Promise<Deck[]>;
    findAll(): Promise<Deck[]>;
    create(deck: Deck): Promise<Deck>;
    findById(id: string): Promise<Deck>;
    updateById(id: string, deck: Deck): Promise<Deck>;
    deleteById(id: string): Promise<Deck>;
}
