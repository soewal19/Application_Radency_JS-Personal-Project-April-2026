import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor() {
    const secret = process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    this.logger.log('JWT strategy initialized');
  }

  async validate(payload: { sub: string; email: string; iat: number; exp: number }) {
    // Payload is already verified by passport-jwt (signature + expiration)
    return { id: payload.sub, email: payload.email };
  }
}
