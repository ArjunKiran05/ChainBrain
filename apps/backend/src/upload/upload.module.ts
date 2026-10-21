import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

import { ParserModule } from '../parser/parser.module';
import { ScannerModule } from '../scanner/scanner.module';
import { AiModule } from '../ai/ai.module';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { RiskModule } from '../risk/risk.module';
import { DependencyModule } from '../dependency/dependency.module';

@Module({
  imports: [
    ParserModule,
    ScannerModule,
    RiskModule,
    RecommendationModule,
    AiModule,
    DependencyModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
