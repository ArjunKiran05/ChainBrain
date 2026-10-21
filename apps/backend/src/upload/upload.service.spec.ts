import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { ScannerService } from '../scanner/scanner.service';
import { RiskService } from '../risk/risk.service';
import { RecommendationService } from '../recommendation/recommendation.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { DependencyGraphService } from '../dependency/dependency.service';

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: ScannerService, useValue: { scan: jest.fn() } },
        { provide: RiskService, useValue: { calculate: jest.fn() } },
        { provide: RecommendationService, useValue: { generate: jest.fn() } },
        { provide: PrismaService, useValue: { scan: { create: jest.fn() } } },
        {
          provide: AiService,
          useValue: { generateReport: jest.fn(), chat: jest.fn() },
        },
        {
          provide: DependencyGraphService,
          useValue: {
            build: jest.fn().mockResolvedValue({ nodes: [], edges: [] }),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
