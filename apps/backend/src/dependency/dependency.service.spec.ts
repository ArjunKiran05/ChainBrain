import { Test, TestingModule } from '@nestjs/testing';
import { DependencyGraphService } from './dependency.service';

describe('DependencyGraphService', () => {
  let service: DependencyGraphService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DependencyGraphService],
    }).compile();

    service = module.get<DependencyGraphService>(DependencyGraphService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
