import { DeckService } from './deck.service';
import { Deck } from './schemas/deck.schema';
import { createDeckDto } from './dto/create-deck.dto';
import { updateDeckDto } from './dto/update-deck.dto';
import { ImportDeckDto } from './dto/import-deck.dto';
import { Cache } from 'cache-manager';
import { ClientProxy } from '@nestjs/microservices';
export declare class DeckController {
    private deckService;
    private cacheManager;
    private readonly rabbitmqClient;
    constructor(deckService: DeckService, cacheManager: Cache, rabbitmqClient: ClientProxy);
    getCommander(name: string): Promise<any>;
    createDeckWithCommander(commanderName: string, deckName: string, req: any): Promise<Deck>;
    getMyDecks(req: any): Promise<unknown>;
    importDeck(importDeckDto: ImportDeckDto, req: any): Promise<{
        message: string;
        deckImport: Deck;
    }>;
    getAllDecks(): Promise<Deck[]>;
    createDeck(deck: createDeckDto, req: any): Promise<Deck>;
    getById(id: string): Promise<Deck>;
    updateDeck(id: string, deck: updateDeckDto, req: any): Promise<Deck>;
    deleteById(id: string, req: any): Promise<Deck>;
}
