/**
 * @module Auth Controller
 * @description Authentication REST controller with refresh token endpoint
 */

import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user', description: 'Creates a new user account and returns JWT tokens' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User created successfully. Returns user data + JWT tokens.' })
  @ApiResponse({ status: 400, description: 'Validation error — invalid input data' })
  @ApiResponse({ status: 409, description: 'Conflict — email already in use' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Sign in', description: 'Authenticates user by email/password and returns JWT tokens' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Successful authentication. Returns user data + JWT tokens.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — invalid email or password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token', description: 'Exchange a valid refresh token for a new token pair' })
  @ApiBody({ schema: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] } })
  @ApiResponse({ status: 200, description: 'New token pair returned' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
}
