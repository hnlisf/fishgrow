import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FishService } from './fish.service';
import type { CreateFishDto, UpdateFishDto, FeedAmount } from './fish.service';

@ApiTags('fish')
@Controller('api/fish')
export class FishController {
  constructor(private readonly service: FishService) {}

  @Get()
  @ApiOperation({ summary: 'List fish in a tank' })
  @ApiQuery({ name: 'tankId', required: true })
  @ApiQuery({ name: 'lang', required: false })
  async list(@Query('tankId') tankId: string, @Query('lang') lang?: string) {
    return this.service.findAllByTank(tankId, lang);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fish detail (with species + recent feed records)' })
  @ApiQuery({ name: 'lang', required: false })
  async detail(@Param('id') id: string, @Query('lang') lang?: string) {
    return this.service.findOne(id, lang);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new fish to a tank' })
  async create(@Body() body: CreateFishDto) {
    return this.service.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update fish (rename)' })
  async update(@Param('id') id: string, @Body() body: UpdateFishDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a fish' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/feed')
  @ApiOperation({ summary: 'Feed a fish (validates frequency vs species)' })
  async feed(@Param('id') id: string, @Body() body: { amount?: FeedAmount }) {
    return this.service.feed(id, body?.amount ?? 'normal');
  }
}
