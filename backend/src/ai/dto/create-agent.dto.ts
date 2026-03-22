import { IsString, IsNotEmpty, IsOptional, IsArray, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAgentDto {
  @ApiProperty({ example: 'Discovery Scout' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'Event Search Specialist' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  role: string;

  @ApiProperty({ example: 'You are the Discovery Scout. You specialize in finding the perfect events for users.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  systemPrompt: string;

  @ApiProperty({ example: ['skill-id-1', 'skill-id-2'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillIds?: string[];
}
