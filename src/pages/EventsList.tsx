/**
 * @module Events List Page
 * @description List of events with pagination (6 per page), search and category filters
 */

import { useEffect, useMemo, useState } from 'react';
import { useEventStore } from '@/store/useEventStore';
import EventCard from '@/components/EventCard';
import PaginationControls from '@/components/PaginationControls';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Sparkles, Plus } from 'lucide-react';
import { EventCategory } from '@/types/event';
import { motion } from 'framer-motion';
import { apiService } from '@/services/api';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const categories = [
  { value: undefined, label: 'All' },
  { value: EventCategory.CONFERENCE, label: 'Conferences' },
  { value: EventCategory.WORKSHOP, label: 'Workshops' },
  { value: EventCategory.MEETUP, label: 'Meetups' },
  { value: EventCategory.WEBINAR, label: 'Webinars' },
  { value: EventCategory.SOCIAL, label: 'Social' },
  { value: EventCategory.SPORT, label: 'Sport' },
];

const EventSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
    <Skeleton className="aspect-video w-full rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <div className="flex justify-between items-center pt-2">
      <Skeleton className="h-8 w-24 rounded-lg" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  </div>
);

const EventsList = () => {
  const {
    events, page, totalPages, total, isLoading,
    fetchEvents, setPage, setSearch, setCategoryFilter, setTagFilters,
    searchQuery, categoryFilter, tagFilters, setupSocketListeners,
  } = useEventStore();

  const [availableTags, setAvailableTags] = useState<{id: string; name: string}[]>([]);
  const [tagLoading, setTagLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
    setupSocketListeners();

    (async () => {
      setTagLoading(true);
      try {
        const tags = await apiService.getTags();
        setAvailableTags(tags);
      } catch {
        // ignore
      } finally {
        setTagLoading(false);
      }
    })();
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
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
              maxLength={100}
            />
          </div>
          <Link to="/assistant">
            <Button variant="outline" className="gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Ask Assistant</span>
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Tags:</span>
          {tagLoading ? (
            <span className="text-xs text-muted-foreground">Loading tags…</span>
          ) : (
            availableTags.map((tag) => {
              const active = tagFilters.includes(tag.name);
              return (
                <Button
                  key={tag.id}
                  size="sm"
                  variant={active ? 'default' : 'outline'}
                  onClick={() => {
                    const next = active
                      ? tagFilters.filter((t) => t !== tag.name)
                      : [...tagFilters, tag.name];
                    setTagFilters(next);
                  }}
                  className="text-[11px]"
                >
                  {tag.name}
                </Button>
              );
            })
          )}
          {tagFilters.length > 0 && (
            <button
              type="button"
              onClick={() => setTagFilters([])}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> Clear tags
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 text-muted-foreground">
          <p className="text-lg font-semibold">No events match the selected tags.</p>
          <p className="text-sm">Try changing your filters or clear the tags.</p>
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
