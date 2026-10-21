import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadModule } from './upload/upload.module';
import { ParserModule } from './parser/parser.module';
import { ScannerModule } from './scanner/scanner.module';
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { RiskModule } from './risk/risk.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { DependencyModule } from './dependency/dependency.module';

@Module({
  imports: [
    UploadModule,
    ParserModule,
    ScannerModule,
    PrismaModule,
    AiModule,
    RiskModule,
    RecommendationModule,
    DependencyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
