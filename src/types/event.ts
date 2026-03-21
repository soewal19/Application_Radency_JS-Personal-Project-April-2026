/**
 * @module Event Types
 * @description DTO и интерфейсы для событий (Events)
 * Следует принципу Interface Segregation (SOLID)
 */

export interface IEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: EventCategory;
  tags: string[];
  maxParticipants: number;
  currentParticipants: number;
  organizerId: string;
  organizerName: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export enum EventCategory {
  CONFERENCE = 'conference',
  WORKSHOP = 'workshop',
  MEETUP = 'meetup',
  WEBINAR = 'webinar',
  SOCIAL = 'social',
  SPORT = 'sport',
}

export interface CreateEventDto {
  title: string;
  description: string;
  date: string;
  location: string;
  category: EventCategory;
  tags?: string[];
  maxParticipants: number;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {}

export interface EventsListResponse {
  data: IEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventsQueryParams {
  page: number;
  limit: number;
  search?: string;
  category?: EventCategory;
  tags?: string[];
  sortBy?: 'date' | 'title' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface JoinEventDto {
  eventId: string;
}

export type EventSocketAction = 
  | 'event:created'
  | 'event:updated'
  | 'event:deleted'
  | 'event:joined'
  | 'event:left';
