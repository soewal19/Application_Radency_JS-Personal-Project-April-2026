/**
 * @module Events List Page
 * @description List of events with pagination (15 per page), search and category filters
 */

import { useEffect } from 'react';
import { useEventStore } from '@/store/useEventStore';
import EventCard from '@/components/EventCard';
import PaginationControls from '@/components/PaginationControls';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { EventCategory } from '@/types/event';
import { motion } from 'framer-motion';

const categories = [
  { value: undefined, label: 'All' },
  { value: EventCategory.CONFERENCE, label: 'Conferences' },
  { value: EventCategory.WORKSHOP, label: 'Workshops' },
  { value: EventCategory.MEETUP, label: 'Meetups' },
  { value: EventCategory.WEBINAR, label: 'Webinars' },
  { value: EventCategory.SOCIAL, label: 'Social' },
  { value: EventCategory.SPORT, label: 'Sport' },
];

const EventsList = () => {
  const {
    events, page, totalPages, total, isLoading,
    fetchEvents, setPage, setSearch, setCategoryFilter,
    searchQuery, categoryFilter, setupSocketListeners,
  } = useEventStore();

  useEffect(() => {
    fetchEvents();
    setupSocketListeners();
  }, []);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground">Events</h1>
        <p className="text-sm text-muted-foreground">Found: {total}</p>
      </motion.div>

      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
            maxLength={100}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.label}
              onClick={() => setCategoryFilter(cat.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === cat.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
          No events found
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default EventsList;
