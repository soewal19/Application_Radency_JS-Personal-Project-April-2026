import { IsString, IsNotEmpty, IsOptional, IsJSON, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSkillDto {
  @ApiProperty({ example: 'getWeather' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Get the current weather for a city' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '{"city": "string"}' })
  @IsString()
  @IsNotEmpty()
  parameters: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isThirdParty?: boolean;

  @ApiProperty({ example: 'https://api.weather.com/v1/skill', required: false })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;
}

export class AddKnowledgeDto {
  @ApiProperty({ example: 'The annual tech summit is held in Berlin in June.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: '{"source": "wiki"}', required: false })
  @IsOptional()
  @IsString()
  metadata?: string;
}
