import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import type { CreateReminderDto, UpdateReminderDto } from './reminders.service';

@ApiTags('reminders')
@Controller('api/reminders')
export class RemindersController {
  constructor(private readonly service: RemindersService) {}

  @Get()
  @ApiOperation({ summary: 'List user reminders (default: pending only)' })
  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'includeDone', required: false, type: Boolean })
  @ApiQuery({ name: 'lang', required: false })
  async list(
    @Query('userId') userId: string,
    @Query('includeDone') includeDone?: string,
    @Query('lang') lang?: string,
  ) {
    if (!userId) throw new BadRequestException('userId required');
    return this.service.list(userId, includeDone === 'true', lang);
  }

  @Post()
  @ApiOperation({ summary: 'Create a reminder' })
  async create(@Body() body: CreateReminderDto) {
    return this.service.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update reminder (mark done or reschedule)' })
  async update(@Param('id') id: string, @Body() body: UpdateReminderDto) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete reminder' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('ensure-defaults')
  @ApiOperation({ summary: 'Auto-generate default reminders for a user (feed/water/clean)' })
  async ensureDefaults(@Body() body: { userId: string }) {
    return this.service.ensureDefaults(body.userId);
  }
}
