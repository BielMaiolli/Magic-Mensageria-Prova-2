"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeckService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const deck_schema_1 = require("./schemas/deck.schema");
const mongoose = __importStar(require("mongoose"));
const microservices_1 = require("@nestjs/microservices");
let DeckService = class DeckService {
    constructor(client, deckModel) {
        this.client = client;
        this.deckModel = deckModel;
    }
    handleDeckImport(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Mensagem recebida: ', data);
            const { commanderName, deckName, userEmail } = data;
            yield new Promise(resolve => setTimeout(resolve, 5000));
            const deck = yield this.createDeckWithCommander(commanderName, deckName, userEmail);
            return {
                message: `Deck ${deckName} criado com sucesso para o usuário ${userEmail}`,
                deck: deck,
            };
        });
    }
    fetchCommander(commanderName) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(commanderName)}`;
            console.log(`Fetching commander from URL: ${url}`);
            const response = yield fetch(url);
            const data = yield response.json();
            console.log('Response from Scryfall API:', data);
            return data;
        });
    }
    fetchCardsByColors(colors) {
        return __awaiter(this, void 0, void 0, function* () {
            const colorQuery = colors.join(',');
            const response = yield fetch(`https://api.scryfall.com/cards/search?q=color%3D${colorQuery}&unique=cards&order=random`);
            const data = yield response.json();
            const cards = [];
            for (const card of data.data) {
                if (card.type_line.includes('Basic Land')) {
                    cards.push(card.name);
                    if (cards.length === 99)
                        break;
                    continue;
                }
                const isRepeatable = card.oracle_text && card.oracle_text.includes('A deck can have any number of cards named');
                if (!isRepeatable && cards.includes(card.name))
                    continue;
                cards.push(card.name);
                if (cards.length === 99)
                    break;
            }
            return cards;
        });
    }
    createDeckWithCommander(commanderName, deckName, userEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            const commander = yield this.fetchCommander(commanderName);
            if (!commander) {
                throw new common_1.NotFoundException('Comandante não encontrado');
            }
            const commanderColors = commander.colors;
            const cards = yield this.fetchCardsByColors(commanderColors);
            const deck = new this.deckModel({
                name: deckName,
                commanderName: commander.name,
                colors: commanderColors,
                cards: cards,
                userEmail,
            });
            return deck.save();
        });
    }
    findDecksByEmail(userEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.deckModel.find({ userEmail });
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const decks = yield this.deckModel.find();
            return decks;
        });
    }
    create(deck) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.deckModel.create(deck);
            return res;
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const deck = yield this.deckModel.findById(id);
            if (!deck) {
                throw new common_1.NotFoundException('O deck não foi encontrado');
            }
            return deck;
        });
    }
    updateById(id, deck) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.deckModel.findByIdAndUpdate(id, deck, {
                new: true,
                runValidators: true,
            });
        });
    }
    deleteById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.deckModel.findByIdAndDelete(id);
        });
    }
};
exports.DeckService = DeckService;
__decorate([
    (0, microservices_1.MessagePattern)('deck_import_queue'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeckService.prototype, "handleDeckImport", null);
exports.DeckService = DeckService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('RABBITMQ_SERVICE')),
    __param(1, (0, mongoose_1.InjectModel)(deck_schema_1.Deck.name)),
    __metadata("design:paramtypes", [microservices_1.ClientProxy, mongoose.Model])
], DeckService);
//# sourceMappingURL=deck.service.js.map