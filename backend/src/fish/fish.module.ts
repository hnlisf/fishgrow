import { Module } from '@nestjs/common';
import { FishController } from './fish.controller';
import { FishService } from './fish.service';
import { FishSpeciesModule } from '../fish-species/fish-species.module';

@Module({
  imports: [FishSpeciesModule],
  controllers: [FishController],
  providers: [FishService],
  exports: [FishService],
})
export class FishModule {}
