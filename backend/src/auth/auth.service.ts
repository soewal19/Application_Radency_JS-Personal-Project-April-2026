/**
 * @module Auth Service
 * @description Authentication business logic with access + refresh tokens
 */

import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    this.logger.log(`Registration attempt: ${dto.email}`);

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      this.logger.warn(`Registration failed — email already in use: ${dto.email}`);
      throw new ConflictException('Email is already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, password: hashedPassword },
    });

    this.logger.log(`User registered: ${user.id} (${user.email})`);
    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    this.logger.log(`Login attempt: ${dto.email}`);

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      this.logger.warn(`Login failed — user not found: ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Login failed — invalid password: ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: ${user.id}`);
    return this.generateTokens(user);
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      this.logger.log(`Token refreshed for user: ${user.id}`);
      return this.generateTokens(user);
    } catch (error) {
      this.logger.warn(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Validate a token and return user info (used by WebSocket gateway)
   */
  async validateToken(token: string): Promise<{ id: string; email: string } | null> {
    try {
      const payload = this.jwtService.verify(token);
      return { id: payload.sub, email: payload.email };
    } catch {
      return null;
    }
  }

  private generateTokens(user: { id: string; email: string; name: string; createdAt: Date }) {
    const payload = { sub: user.id, email: user.email };
    return {
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      accessToken: this.jwtService.sign(payload, { expiresIn: '1h' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }
}
