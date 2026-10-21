import { Injectable } from '@nestjs/common';

@Injectable()
export class ParserService {
  extract(zipPath: string) {
    return {
      message: 'ZIP received',
      path: zipPath,
    };
  }
}
