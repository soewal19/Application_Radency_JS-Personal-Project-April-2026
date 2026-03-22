/**
 * @module Event Store
 * @description Zustand store for events with pagination (15 records per page)
 * Single Responsibility Principle (SOLID)
 */

import { create } from 'zustand';
import type { IEvent, EventsQueryParams, EventCategory } from '@/types/event';
import { apiService } from '@/services/api';
import { socketService } from '@/services/socket';
import { logger } from '@/lib/logger';

const PAGE_SIZE = 15;

/** Mock data for demo mode */
const generateMockEvents = (): IEvent[] => {
  const categories: EventCategory[] = ['conference', 'workshop', 'meetup', 'webinar', 'social', 'sport'] as EventCategory[];
  const titles = [
    'React Summit 2026', 'TypeScript Masterclass', 'DevOps Meetup', 'AI Workshop',
    'Cloud Native Conf', 'Frontend Bootcamp', 'Agile Retrospective', 'Design Sprint',
    'Hackathon Weekend', 'Tech Talk: WebSockets', 'Kubernetes Workshop', 'GraphQL Day',
    'Rust for Web Devs', 'Mobile Dev Meetup', 'Security Summit', 'Open Source Friday',
    'Data Engineering Talk', 'UX Research Lab', 'Blockchain Seminar', 'IoT Conference',
    'ML Ops Workshop', 'Platform Engineering', 'Go Lang Meetup', 'Vue.js Conf',
    'Node.js Deep Dive', 'Docker Masterclass', 'AWS Community Day', 'Testing Summit',
    'Microservices Talk', 'Web Performance Day',
  ];
  const locations = ['New York', 'San Francisco', 'Online', 'London', 'Berlin', 'Tokyo'];
  const organizers = ['Alice', 'Bob', 'Charlie', 'Diana', 'Edward'];
  const tagsPool = ['Tech', 'Art', 'Business', 'Music', 'Design', 'Health', 'Education'];

  return titles.map((title, i) => {
    const tagCount = 1 + (i % 3);
    const eventTags = Array.from({ length: tagCount }, (_, idx) => tagsPool[(i + idx) % tagsPool.length]);

    return {
      id: `evt-${i + 1}`,
      title,
      description: `Join us at ${title}! We will discuss the latest trends and best practices. Expect workshops, networking and great speakers.`,
      date: new Date(2026, 3 + Math.floor(i / 5), 1 + (i * 3) % 28, 10 + (i % 8)).toISOString(),
      location: locations[i % locations.length],
      category: categories[i % categories.length],
      tags: eventTags,
      maxParticipants: 50 + i * 10,
      currentParticipants: Math.floor(Math.random() * 40),
      organizerId: `user-${(i % 5) + 1}`,
      organizerName: organizers[i % 5],
      creatorType: 'manual' as const,
      createdAt: new Date(2026, 2, 1 + i).toISOString(),
      updatedAt: new Date(2026, 2, 1 + i).toISOString(),
    };
  });
};

const ALL_MOCK_EVENTS = generateMockEvents();

interface EventState {
  events: IEvent[];
  myEvents: IEvent[];
  currentEvent: IEvent | null;
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  categoryFilter: EventCategory | undefined;
  tagFilters: string[];
  availableTags: string[];

  fetchEvents: (params?: Partial<EventsQueryParams>) => Promise<void>;
  fetchMyEvents: (params?: Partial<EventsQueryParams>) => Promise<void>;
  fetchEvent: (id: string) => Promise<void>;
  fetchTags: () => Promise<void>;
  createEvent: (event: Omit<IEvent, 'id' | 'organizerId' | 'organizerName' | 'currentParticipants' | 'createdAt' | 'updatedAt'>) => Promise<IEvent | void>;
  updateEvent: (id: string, data: Partial<IEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  joinEvent: (id: string) => Promise<void>;
  leaveEvent: (id: string) => Promise<void>;
  registerSomeone: (eventId: string, email: string) => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (query: string) => void;
  setCategoryFilter: (category: EventCategory | undefined) => void;
  setTagFilters: (tags: string[]) => void;
  setupSocketListeners: () => void;
}

export const useEventStore = create<EventState>()((set, get) => ({
  events: [],
  myEvents: [],
  currentEvent: null,
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  searchQuery: '',
  categoryFilter: undefined,
  tagFilters: [],
  availableTags: [],

  fetchEvents: async (params) => {
    set({ isLoading: true, error: null });
    const { page, searchQuery, categoryFilter } = get();
    logger.store('Events', 'fetchEvents', { page: params?.page ?? page });
    try {
      const response = await apiService.getEvents({
        page: params?.page ?? page,
        limit: PAGE_SIZE,
        search: params?.search ?? (searchQuery || undefined),
        category: params?.category ?? categoryFilter,
        tags: params?.tags ?? get().tagFilters,
      });
      set({
        events: response.data,
        total: response.total,
        totalPages: response.totalPages,
        page: response.page,
        isLoading: false,
      });
    } catch {
      let filtered = ALL_MOCK_EVENTS;
      const search = params?.search ?? searchQuery;
      const cat = params?.category ?? categoryFilter;
      if (search) {
        filtered = filtered.filter(e =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.description.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (cat) {
        filtered = filtered.filter(e => e.category === cat);
      }
      const tags = params?.tags ?? get().tagFilters;
      if (tags && tags.length) {
        filtered = filtered.filter(e => e.tags?.some((t) => tags.includes(t)));
      }
      const currentPage = params?.page ?? page;
      const start = (currentPage - 1) * PAGE_SIZE;
      set({
        events: filtered.slice(start, start + PAGE_SIZE),
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / PAGE_SIZE),
        page: currentPage,
        isLoading: false,
      });
    }
  },

  fetchMyEvents: async (params) => {
    set({ isLoading: true });
    try {
      const response = await apiService.getMyEvents({
        page: params?.page ?? 1,
        limit: PAGE_SIZE,
      });
      set({ myEvents: response.data, isLoading: false });
    } catch {
      set({ myEvents: ALL_MOCK_EVENTS.slice(0, 8), isLoading: false });
    }
  },

  fetchEvent: async (id: string) => {
    set({ isLoading: true });
    try {
      const event = await apiService.getEvent(id);
      set({ currentEvent: event, isLoading: false });
    } catch {
      const found = ALL_MOCK_EVENTS.find(e => e.id === id) || null;
      set({ currentEvent: found, isLoading: false });
    }
  },

  fetchTags: async () => {
    try {
      const tags = await apiService.getTags();
      set({ availableTags: tags });
    } catch (error) {
      const tagsPool = ['Tech', 'Art', 'Business', 'Music', 'Design', 'Health', 'Education'];
      set({ availableTags: tagsPool });
    }
  },

  createEvent: async (eventData) => {
    set({ isLoading: true });
    logger.store('Events', 'createEvent', { title: eventData.title });
    try {
      // Requirement 1: Use REST API instead of Socket for creating to ensure direct feedback
      const created = await apiService.createEvent(eventData as any);
      
      // Update local state immediately
      set((state) => ({
        events: [created, ...state.events].slice(0, PAGE_SIZE),
        myEvents: [created, ...state.myEvents],
        isLoading: false
      }));
      
      return created;
    } catch (error) {
      // Fallback to mock mode
      const newEvent: IEvent = {
        ...eventData,
        id: `evt-${Date.now()}`,
        organizerId: '1',
        organizerName: 'You',
        tags: eventData.tags ?? [],
        currentParticipants: 0,
        creatorType: (eventData as any).creatorType || 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => ({
        events: [newEvent, ...state.events].slice(0, PAGE_SIZE),
        myEvents: [newEvent, ...state.myEvents],
        isLoading: false
      }));
    }
  },

  updateEvent: async (id: string, data: Partial<IEvent>) => {
    set({ isLoading: true });
    try {
      const updated = await socketService.emit('updateEvent', { id, data });
      set((state) => ({
        events: state.events.map((e) => (e.id === updated.id ? updated : e)),
        currentEvent: state.currentEvent?.id === updated.id ? updated : state.currentEvent,
      }));
      set({ isLoading: false });
      return updated;
    } catch {
      // fallback: update mock
      const idx = ALL_MOCK_EVENTS.findIndex((e) => e.id === id);
      if (idx !== -1) {
        ALL_MOCK_EVENTS[idx] = { ...ALL_MOCK_EVENTS[idx], ...data };
      }
      get().fetchEvents();
      set({ isLoading: false });
    }
  },

  deleteEvent: async (id: string) => {
    set({ isLoading: true });
    try {
      await socketService.emit('deleteEvent', id);
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        currentEvent: state.currentEvent?.id === id ? null : state.currentEvent,
      }));
    } catch {
      const idx = ALL_MOCK_EVENTS.findIndex(e => e.id === id);
      if (idx !== -1) ALL_MOCK_EVENTS.splice(idx, 1);
    } finally {
      set({ isLoading: false });
      get().fetchEvents();
    }
  },

  joinEvent: async (id: string) => {
    set({ isLoading: true });
    try {
      await socketService.emit('joinEvent', id);
    } catch {
      const evt = ALL_MOCK_EVENTS.find(e => e.id === id);
      if (evt) evt.currentParticipants++;
    } finally {
      set({ isLoading: false });
      get().fetchEvent(id);
    }
  },

  leaveEvent: async (id: string) => {
    set({ isLoading: true });
    try {
      await socketService.emit('leaveEvent', id);
    } catch {
      const evt = ALL_MOCK_EVENTS.find(e => e.id === id);
      if (evt && evt.currentParticipants > 0) evt.currentParticipants--;
    } finally {
      set({ isLoading: false });
      get().fetchEvent(id);
    }
  },

  registerSomeone: async (eventId: string, email: string) => {
    set({ isLoading: true });
    try {
      await socketService.emit('registerSomeone', { eventId, email });
    } catch (error) {
      // In mock mode we can't easily register by email, so we just increment
      const evt = ALL_MOCK_EVENTS.find(e => e.id === eventId);
      if (evt) evt.currentParticipants++;
      throw error; // Re-throw so the UI can show error toast
    } finally {
      set({ isLoading: false });
      get().fetchEvent(eventId);
    }
  },

  setPage: (page: number) => {
    set({ page });
    get().fetchEvents({ page });
  },

  setSearch: (query: string) => {
    set({ searchQuery: query, page: 1 });
    get().fetchEvents({ search: query, page: 1 });
  },

  setCategoryFilter: (category) => {
    set({ categoryFilter: category, page: 1 });
    get().fetchEvents({ category, page: 1 });
  },

  setTagFilters: (tags) => {
    set({ tagFilters: tags, page: 1 });
    get().fetchEvents({ tags, page: 1 });
  },

  setupSocketListeners: () => {
    socketService.on('event:created', (event) => {
      set((state) => ({ 
        events: [event, ...state.events].slice(0, PAGE_SIZE),
        // Requirement 1: If the current user is the organizer, add to myEvents
        myEvents: event.organizerId === state.myEvents[0]?.organizerId 
          ? [event, ...state.myEvents] 
          : state.myEvents
      }));
    });
    socketService.on('event:updated', (event) => {
      set((state) => ({
        events: state.events.map(e => e.id === event.id ? event : e),
        currentEvent: state.currentEvent?.id === event.id ? event : state.currentEvent,
      }));
    });
    socketService.on('event:deleted', (event) => {
      set((state) => ({
        events: state.events.filter(e => e.id !== event.id),
      }));
    });
  },
}));
