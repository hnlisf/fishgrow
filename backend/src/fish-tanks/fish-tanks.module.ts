import { Module } from '@nestjs/common';
import { FishTanksController } from './fish-tanks.controller';
import { FishTanksService } from './fish-tanks.service';
import { FishSpeciesModule } from '../fish-species/fish-species.module';

@Module({
  imports: [FishSpeciesModule],
  controllers: [FishTanksController],
  providers: [FishTanksService],
  exports: [FishTanksService],
})
export class FishTanksModule {}
