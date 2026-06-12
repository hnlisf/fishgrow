import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FishTanksService } from './fish-tanks.service';
import type { CreateFishTankDto, UpdateFishTankDto } from './fish-tanks.service';

@ApiTags('fish-tanks')
@Controller('api/fish-tanks')
export class FishTanksController {
  constructor(private readonly service: FishTanksService) {}

  @Get()
  @ApiOperation({ summary: 'List all fish tanks for a user' })
  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'lang', required: false })
  async list(@Query('userId') userId: string, @Query('lang') lang?: string) {
    return this.service.findAllByUser(userId, lang);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fish tank detail' })
  @ApiQuery({ name: 'lang', required: false })
  async detail(@Param('id') id: string, @Query('lang') lang?: string) {
    return this.service.findOne(id, lang);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new fish tank' })
  async create(@Body() body: CreateFishTankDto) {
    return this.service.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a fish tank' })
  async update(@Param('id') id: string, @Body() body: UpdateFishTankDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a fish tank' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/tick')
  @ApiOperation({ summary: 'Tick tank status (cleanliness/oxygen decay)' })
  async tick(@Param('id') id: string, @Body() body: { hoursDelta?: number }) {
    return this.service.tick(id, body?.hoursDelta);
  }
}
