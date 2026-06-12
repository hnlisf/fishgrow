import { Module } from '@nestjs/common';
import { FishSpeciesService } from './fish-species.service';
import { FishSpeciesController } from './fish-species.controller';

@Module({
  controllers: [FishSpeciesController],
  providers: [FishSpeciesService],
  exports: [FishSpeciesService],
})
export class FishSpeciesModule {}
