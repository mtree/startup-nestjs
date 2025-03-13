import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    const secret = configService.get('JWT_SECRET') || 'your-secret-key';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    this.logger = new Logger(JwtStrategy.name);
  }

  async validate(payload: { sub: string, email: string }) {
    this.logger.debug(`Validating JWT payload: ${JSON.stringify(payload)}`);
    
    const user = await this.userRepository.findOne({ 
      where: { id: payload.sub },
      select: ['id', 'email', 'firstName', 'lastName', 'isActive', 'createdAt', 'updatedAt']
    });

    if (!user) {
      this.logger.error(`User not found for id: ${payload.sub}`);
      throw new UnauthorizedException('User not found');
    }

    this.logger.debug(`User found: ${JSON.stringify(user)}`);
    return user;
  }
}
