/**
 * @module Auth Module
 * @description Authentication module with secure JWT configuration via ConfigService
 */

import { Module, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

const logger = new Logger('AuthModule');

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'super-secret-key') {
  logger.warn(
    '⚠️  JWT_SECRET is not set or uses the insecure default! ' +
    'Set a strong secret in .env (min 32 chars). ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  );
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtSecret || 'CHANGE_ME_IN_PRODUCTION',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
