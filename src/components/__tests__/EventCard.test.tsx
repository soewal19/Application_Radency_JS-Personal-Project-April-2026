/**
 * @module Frontend Tests — EventCard
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EventCard from '@/components/EventCard';
import type { IEvent } from '@/types/event';
import { EventCategory } from '@/types/event';

const mockEvent: IEvent = {
  id: 'test-1',
  title: 'React Summit 2026',
  description: 'Конференция для React разработчиков',
  date: '2026-06-15T10:00:00.000Z',
  location: 'Москва',
  category: EventCategory.CONFERENCE,
  maxParticipants: 100,
  currentParticipants: 45,
  organizerId: 'user-1',
  organizerName: 'Алексей',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

describe('EventCard', () => {
  it('renders event title', () => {
    render(
      <BrowserRouter>
        <EventCard event={mockEvent} index={0} />
      </BrowserRouter>
    );
    expect(screen.getByText('React Summit 2026')).toBeInTheDocument();
  });

  it('renders location', () => {
    render(
      <BrowserRouter>
        <EventCard event={mockEvent} index={0} />
      </BrowserRouter>
    );
    expect(screen.getByText('Москва')).toBeInTheDocument();
  });

  it('shows available spots', () => {
    render(
      <BrowserRouter>
        <EventCard event={mockEvent} index={0} />
      </BrowserRouter>
    );
    expect(screen.getByText('55 мест')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(
      <BrowserRouter>
        <EventCard event={mockEvent} index={0} />
      </BrowserRouter>
    );
    expect(screen.getByText('Конференция')).toBeInTheDocument();
  });
});
