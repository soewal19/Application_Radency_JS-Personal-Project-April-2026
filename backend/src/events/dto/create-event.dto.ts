import { IsNotEmpty, IsString, IsEnum, IsNumber, Min, Max, MinLength, MaxLength, IsDateString, IsOptional, IsArray, ArrayMaxSize, ArrayUnique } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum EventCategory {
  CONFERENCE = 'conference',
  WORKSHOP = 'workshop',
  MEETUP = 'meetup',
  WEBINAR = 'webinar',
  SOCIAL = 'social',
  SPORT = 'sport',
}

export class CreateEventDto {
  @ApiProperty({ example: 'React Summit 2026' })
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(100, { message: 'Title must be under 100 characters' })
  title: string;

  @ApiProperty({ example: 'A conference for React developers' })
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(1000, { message: 'Description must be under 1000 characters' })
  description: string;

  @ApiProperty({ example: '2026-06-15T10:00:00.000Z' })
  @IsDateString({}, { message: 'Invalid date format' })
  date: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @MinLength(2, { message: 'Location must be at least 2 characters' })
  @MaxLength(100, { message: 'Location must be under 100 characters' })
  location: string;

  @ApiProperty({ enum: EventCategory, example: EventCategory.CONFERENCE })
  @IsEnum(EventCategory, { message: 'Invalid category' })
  category: EventCategory;

  @ApiProperty({ example: 100 })
  @IsNumber({}, { message: 'Max participants must be a number' })
  @Min(2, { message: 'At least 2 participants required' })
  @Max(10000, { message: 'Maximum 10,000 participants' })
  maxParticipants: number;

  @ApiProperty({ example: ['Tech', 'Music'], required: false })
  @IsOptional()
  @IsArray({ message: 'Tags must be an array of strings' })
  @ArrayMaxSize(5, { message: 'Maximum 5 tags allowed' })
  @ArrayUnique({ message: 'Tags must be unique' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @MinLength(1, { each: true, message: 'Tags cannot be empty' })
  @MaxLength(30, { each: true, message: 'Tags must be under 30 characters' })
  tags?: string[];
}
