import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private helmetMiddleware: ReturnType<typeof helmet>;

  constructor() {
    this.helmetMiddleware = helmet();
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.helmetMiddleware(req, res, next);
  }
}
