import { Document } from 'mongoose';
export declare enum Colors {
    WHITE = "W",
    BLUE = "U",
    BLACK = "B",
    RED = "R",
    GREEN = "G"
}
export declare class Deck {
    name: string;
    commanderName: string;
    cards: string[];
    colors: string[];
    userEmail: string;
}
export declare const DeckSchema: import("mongoose").Schema<Deck, import("mongoose").Model<Deck, any, any, any, Document<unknown, any, Deck> & Deck & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v?: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Deck, Document<unknown, {}, import("mongoose").FlatRecord<Deck>> & import("mongoose").FlatRecord<Deck> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v?: number;
}>;
