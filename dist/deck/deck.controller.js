"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
exports.DeckController = void 0;
const common_1 = require("@nestjs/common");
const deck_service_1 = require("./deck.service");
const create_deck_dto_1 = require("./dto/create-deck.dto");
const update_deck_dto_1 = require("./dto/update-deck.dto");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const role_enum_1 = require("../auth/enums/role.enum");
const import_deck_dto_1 = require("./dto/import-deck.dto");
const commander_validator_1 = require("./validators/commander-validator");
const cache_manager_1 = require("@nestjs/cache-manager");
const microservices_1 = require("@nestjs/microservices");
let DeckController = class DeckController {
    constructor(deckService, cacheManager, rabbitmqClient) {
        this.deckService = deckService;
        this.cacheManager = cacheManager;
        this.rabbitmqClient = rabbitmqClient;
    }
    getCommander(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!name) {
                throw new Error('Missing "name" query parameter');
            }
            return this.deckService.fetchCommander(name);
        });
    }
    createDeckWithCommander(commanderName, deckName, req) {
        return __awaiter(this, void 0, void 0, function* () {
            const userEmail = req.user.email;
            console.log('Received parameters:', { commanderName, deckName });
            if (!commanderName || !deckName) {
                throw new common_1.BadRequestException('Comandante e nome do deck são obrigatórios.');
            }
            if (typeof commanderName !== 'string' || typeof deckName !== 'string') {
                throw new common_1.BadRequestException('Comandante e nome do deck devem ser strings.');
            }
            try {
                const newDeck = yield this.deckService.createDeckWithCommander(commanderName, deckName, userEmail);
                const cacheKey = `myDecks_${userEmail}`;
                yield this.cacheManager.del(cacheKey);
                return newDeck;
            }
            catch (error) {
                console.error('Error creating deck:', error);
                throw new common_1.BadRequestException('Erro ao criar o deck.');
            }
        });
    }
    getMyDecks(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const userEmail = req.user.email;
            const cacheKey = `myDecks_${userEmail}`;
            const cachedDecks = yield this.cacheManager.get(cacheKey);
            if (cachedDecks) {
                return cachedDecks;
            }
            const decks = yield this.deckService.findDecksByEmail(userEmail);
            yield this.cacheManager.set(cacheKey, decks);
            return decks;
        });
    }
    importDeck(importDeckDto, req) {
        return __awaiter(this, void 0, void 0, function* () {
            const isValid = (0, commander_validator_1.validateCommanderDeck)(importDeckDto);
            if (!isValid) {
                throw new common_1.BadRequestException('O baralho não segue as regras do formato Commander.');
            }
            const userEmail = req.user.email;
            const deckImport = yield this.deckService.create(importDeckDto);
            setTimeout(() => {
                this.rabbitmqClient.emit('deck_import_queue', {
                    userEmail,
                    deckName: deckImport.name,
                });
            }, 5000);
            const cacheKey = `myDecks_${userEmail}`;
            yield this.cacheManager.del(cacheKey);
            return { message: '| Importação do deck iniciada |', deckImport };
        });
    }
    getAllDecks() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.deckService.findAll();
        });
    }
    createDeck(deck, req) {
        return __awaiter(this, void 0, void 0, function* () {
            const userEmail = req.user.email;
            const newDeckManual = yield this.deckService.create(deck);
            const cacheKey = `myDecks_${userEmail}`;
            yield this.cacheManager.del(cacheKey);
            return newDeckManual;
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.deckService.findById(id);
        });
    }
    updateDeck(id, deck, req) {
        return __awaiter(this, void 0, void 0, function* () {
            const userEmail = req.user.email;
            const updateDeck = yield this.deckService.updateById(id, deck);
            const cacheKey = `myDecks_${userEmail}`;
            yield this.cacheManager.del(cacheKey);
            return updateDeck;
        });
    }
    deleteById(id, req) {
        return __awaiter(this, void 0, void 0, function* () {
            const userEmail = req.user.email;
            const deleteDeck = yield this.deckService.deleteById(id);
            const cacheKey = `myDecks_${userEmail}`;
            yield this.cacheManager.del(cacheKey);
            return deleteDeck;
        });
    }
};
exports.DeckController = DeckController;
__decorate([
    (0, common_1.Get)('commander'),
    __param(0, (0, common_1.Query)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeckController.prototype, "getCommander", null);
__decorate([
    (0, common_1.Post)('newDeckWithCommander'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)()),
    __param(0, (0, common_1.Query)('commanderName')),
    __param(1, (0, common_1.Query)('deckName')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DeckController.prototype, "createDeckWithCommander", null);
__decorate([
    (0, common_1.Get)('myDecks'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)()),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DeckController.prototype, "getMyDecks", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)()),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [import_deck_dto_1.ImportDeckDto, Object]),
    __metadata("design:returntype", Promise)
], DeckController.prototype, "importDeck", null);
__decorate([
    (0, common_1.Get)('allDecks'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)(), roles_guard_1.RolesGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeckController.prototype, "getAllDecks", null);
__decorate([
    (0, common_1.Post)('newDeckManual'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)()),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_deck_dto_1.createDeckDto, Object]),
    __metadata("design:returntype", Promise)
], DeckController.prototype, "createDeck", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeckController.prototype, "getById", null);
__decorate([
    (0, common_1.Put)('/updateDeck/:id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)()),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_deck_dto_1.updateDeckDto, Object]),
    __metadata("design:returntype", Promise)
], DeckController.prototype, "updateDeck", null);
__decorate([
    (0, common_1.Delete)('/deleteDeck/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.USER, role_enum_1.Role.MODERADOR),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)(), roles_guard_1.RolesGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DeckController.prototype, "deleteById", null);
exports.DeckController = DeckController = __decorate([
    (0, common_1.Controller)('deck'),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __param(2, (0, common_1.Inject)('RABBITMQ_SERVICE')),
    __metadata("design:paramtypes", [deck_service_1.DeckService, Object, microservices_1.ClientProxy])
], DeckController);
//# sourceMappingURL=deck.controller.js.map