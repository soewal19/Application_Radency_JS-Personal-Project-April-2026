import { IsEmail, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(50, { message: 'Name must be under 50 characters' })
  @Matches(/^[a-zA-Zа-яА-ЯёЁ\s'-]+$/, { message: 'Name contains invalid characters' })
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  @MaxLength(255, { message: 'Email must be under 255 characters' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(100, { message: 'Password must be under 100 characters' })
  password: string;
}
