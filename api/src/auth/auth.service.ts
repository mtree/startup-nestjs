import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserWithoutPassword | null> {
    this.logger.debug(`Attempting to validate user: ${email}`);
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user;
      this.logger.debug(`User ${email} validated successfully`);
      return result;
    }
    
    this.logger.debug(`Invalid credentials for user: ${email}`);
    return null;
  }

  async login(user: UserWithoutPassword) {
    const payload = { sub: user.id, email: user.email };
    this.logger.debug(`Generating JWT token for user: ${user.email}`);
    const token = this.jwtService.sign(payload);
    this.logger.debug(`Token generated successfully`);
    return {
      access_token: token,
    };
  }

  async register(email: string, password: string, firstName: string, lastName: string): Promise<UserWithoutPassword> {
    this.logger.debug(`Attempting to register user: ${email}`);
    
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      this.logger.warn(`Registration failed: Email already exists: ${email}`);
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    const savedUser = await this.userRepository.save(user);
    const { password: _, ...result } = savedUser;
    this.logger.debug(`User registered successfully: ${email}`);
    return result;
  }
}
