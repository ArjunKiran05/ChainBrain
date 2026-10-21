import { Module } from '@nestjs/common';
import { DependencyGraphService } from './dependency.service';

@Module({
  providers: [DependencyGraphService],
  exports: [DependencyGraphService],
})
export class DependencyModule {}
