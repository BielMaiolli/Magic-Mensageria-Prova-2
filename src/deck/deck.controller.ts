import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DeckService } from './deck.service';
import { Deck } from './schemas/deck.schema';
import { createDeckDto } from './dto/create-deck.dto';
import { updateDeckDto } from './dto/update-deck.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { ImportDeckDto } from './dto/import-deck.dto';
import { validateCommanderDeck } from './validators/commander-validator';
import { CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ClientProxy } from '@nestjs/microservices';

@Controller('deck')
@UseInterceptors(CacheInterceptor)
export class DeckController {
  constructor(
    private deckService: DeckService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitmqClient: ClientProxy,
  ) {}

  // Método para buscar o comandante na API externa
  @Get('commander')
  async getCommander(@Query('name') name: string): Promise<any> {
    if (!name) {
      throw new BadRequestException('O parâmetro "name" é obrigatório.');
    }
    return this.deckService.fetchCommander(name);
  }

  // Criar deck com comandante
  @Post('newDeckWithCommander')
  @UseGuards(AuthGuard())
  async createDeckWithCommander(
    @Query('commanderName') commanderName: string,
    @Query('deckName') deckName: string,
    @Req() req: any,
  ): Promise<Deck> {
    const userEmail = req.user.email;

    if (!commanderName || !deckName) {
      throw new BadRequestException(
        'Os parâmetros "commanderName" e "deckName" são obrigatórios.',
      );
    }

    try {
      const newDeck = await this.deckService.createDeckWithCommander(
        commanderName,
        deckName,
        userEmail,
      );
      const cacheKey = `myDecks_${userEmail}`;
      await this.cacheManager.del(cacheKey);
      return newDeck;
    } catch (error) {
      console.error('Erro ao criar o deck:', error);
      throw new BadRequestException('Erro ao criar o deck.');
    }
  }

  // Obter decks do usuário autenticado
  @Get('myDecks')
  @UseGuards(AuthGuard())
  async getMyDecks(@Req() req: any) {
    const userEmail = req.user.email;
    const cacheKey = `myDecks_${userEmail}`;

    const cachedDecks = await this.cacheManager.get(cacheKey);
    if (cachedDecks) {
      return cachedDecks;
    }

    const decks = await this.deckService.findDecksByEmail(userEmail);
    await this.cacheManager.set(cacheKey, decks);

    return decks;
  }

  // Importar deck via RabbitMQ
  @Post('import')
  @UseGuards(AuthGuard())
  async importDeck(
    @Body() importDeckDto: ImportDeckDto,
    @Req() req: any,
  ): Promise<any> {
    const userEmail = req.user.email;

    const isValid = validateCommanderDeck(importDeckDto);
    if (!isValid) {
      throw new BadRequestException(
        'O baralho não segue as regras do formato Commander.',
      );
    }

    try {
      const deckImport = await this.deckService.create(importDeckDto);

      setTimeout(() => {
        this.rabbitmqClient.emit('deck_import_queue', {
          userEmail,
          deckName: deckImport.name,
        });
      }, 5000);

      const cacheKey = `myDecks_${userEmail}`;
      await this.cacheManager.del(cacheKey);

      return {
        message: 'Importação do deck iniciada.',
        deckImport,
      };
    } catch (error) {
      console.error('Erro ao importar o deck:', error);
      throw new BadRequestException('Erro ao importar o deck.');
    }
  }

  // Endpoint para processar diretamente o handleDeckImport
  @Post('handleDeckImport')
  async handleDeckImportEndpoint(@Body() data: any): Promise<any> {
    console.log('Chamando handleDeckImport do controller com dados:', data);
    try {
      const result = await this.deckService.handleDeckImport(data);
      return {
        message: 'Processamento de importação realizado com sucesso',
        result,
      };
    } catch (error) {
      console.error('Erro ao processar importação:', error);
      throw new BadRequestException('Erro ao processar importação.');
    }
  }

  // Obter todos os decks (somente admins)
  @Get('allDecks')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard(), RolesGuard)
  async getAllDecks(): Promise<Deck[]> {
    return this.deckService.findAll();
  }

  // Criar novo deck manualmente
  @Post('newDeckManual')
  @UseGuards(AuthGuard())
  async createDeck(
    @Body() deck: createDeckDto,
    @Req() req: any,
  ): Promise<Deck> {
    const userEmail = req.user.email;

    try {
      const newDeckManual = await this.deckService.create(deck);
      const cacheKey = `myDecks_${userEmail}`;
      await this.cacheManager.del(cacheKey);
      return newDeckManual;
    } catch (error) {
      console.error('Erro ao criar o deck manual:', error);
      throw new BadRequestException('Erro ao criar o deck manual.');
    }
  }

  // Obter um deck por ID
  @Get(':id')
  async getById(@Param('id') id: string): Promise<Deck> {
    return this.deckService.findById(id);
  }

  // Atualizar um deck por ID
  @Put('/updateDeck/:id')
  @UseGuards(AuthGuard())
  async updateDeck(
    @Param('id') id: string,
    @Body() deck: updateDeckDto,
    @Req() req: any,
  ): Promise<Deck> {
    const userEmail = req.user.email;

    try {
      const updatedDeck = await this.deckService.updateById(id, deck);
      const cacheKey = `myDecks_${userEmail}`;
      await this.cacheManager.del(cacheKey);
      return updatedDeck;
    } catch (error) {
      console.error('Erro ao atualizar o deck:', error);
      throw new BadRequestException('Erro ao atualizar o deck.');
    }
  }

  // Deletar um deck por ID
  @Delete('/deleteDeck/:id')
  @Roles(Role.ADMIN, Role.USER, Role.MODERADOR)
  @UseGuards(AuthGuard(), RolesGuard)
  async deleteById(@Param('id') id: string, @Req() req: any): Promise<Deck> {
    const userEmail = req.user.email;

    try {
      const deletedDeck = await this.deckService.deleteById(id);
      const cacheKey = `myDecks_${userEmail}`;
      await this.cacheManager.del(cacheKey);
      return deletedDeck;
    } catch (error) {
      console.error('Erro ao deletar o deck:', error);
      throw new BadRequestException('Erro ao deletar o deck.');
    }
  }
}
