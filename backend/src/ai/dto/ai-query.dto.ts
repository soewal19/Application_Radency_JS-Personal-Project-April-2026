import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AiQueryDto {
  @ApiProperty({ description: 'User message for the assistant', example: 'Что интересного в Киеве на выходных?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Query is too long (max 2000 characters)' })
  query: string;

  @ApiProperty({ required: false, description: 'Optional context to help the assistant', example: 'User prefers rock concerts' })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Context is too long (max 1000 characters)' })
  context?: string;

  @ApiProperty({ required: false, description: 'Optional ID of a specific event to focus on' })
  @IsOptional()
  @IsString()
  eventId?: string;
}
