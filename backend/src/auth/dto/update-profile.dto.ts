import { IsString, IsOptional, MaxLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'data:image/png;base64,iVBOR...', required: false, description: 'Base64 encoded avatar image' })
  @IsOptional()
  @IsString()
  avatar?: string;
}
