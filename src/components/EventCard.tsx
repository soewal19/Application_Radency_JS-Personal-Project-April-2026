/**
 * @module EventCard
 * @description Event card with electric border effect and registration link
 */

import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users, Zap, User } from 'lucide-react';
import { motion } from 'framer-motion';
import type { IEvent, ITag } from '@/types/event';
import { Badge } from '@/components/ui/badge';
import ElectricCard from '@/components/ElectricCard';

const categoryLabels: Record<string, string> = {
  conference: 'Conference', workshop: 'Workshop', meetup: 'Meetup',
  webinar: 'Webinar', social: 'Social', sport: 'Sport',
};

const categoryColors: Record<string, string> = {
  conference: 'bg-primary/10 text-primary border-primary/20',
  workshop: 'bg-accent/10 text-accent border-accent/20',
  meetup: 'bg-warning/10 text-warning border-warning/20',
  webinar: 'bg-destructive/10 text-destructive border-destructive/20',
  social: 'bg-success/10 text-success border-success/20',
  sport: 'bg-muted text-muted-foreground border-border',
};

/**
 * Generates a stable color for a tag based on its name or uses the provided color.
 */
const getTagStyles = (tag: ITag | string) => {
  const tagName = typeof tag === 'string' ? tag : tag.name;
  const tagColor = typeof tag === 'string' ? null : tag.color;

  // Requirement 3 (ai-generated tag): special styling
  if (tagName.toLowerCase() === 'ai-generated') {
    return {
      className: 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-indigo-600 border-indigo-500/30 font-semibold',
      style: {}
    };
  }

  if (tagColor) {
    return {
      className: 'border-opacity-20',
      style: { 
        backgroundColor: `${tagColor}1a`, // 10% opacity hex
        color: tagColor,
        borderColor: `${tagColor}33` // 20% opacity hex
      }
    };
  }

  const colors = [
    'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'bg-purple-500/10 text-purple-600 border-purple-500/20',
    'bg-pink-500/10 text-pink-600 border-pink-500/20',
    'bg-orange-500/10 text-orange-600 border-orange-500/20',
    'bg-green-500/10 text-green-600 border-green-500/20',
    'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    'bg-red-500/10 text-red-600 border-red-500/20',
    'bg-teal-500/10 text-teal-600 border-teal-500/20',
    'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  ];
  
  // Simple hash function to get stable index
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return { className: colors[index], style: {} };
};

interface EventCardProps {
  event: IEvent;
  index: number;
}

const EventCard = ({ event, index }: EventCardProps) => {
  const date = new Date(event.date);
  const spotsLeft = event.maxParticipants - event.currentParticipants;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative"
    >
      {event.creatorType === 'ai' && (
        <Badge 
          className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-none shadow-lg animate-pulse"
        >
          <Zap className="mr-1 h-3 w-3 fill-current" />
          Created with AI assistance
        </Badge>
      )}
      <ElectricCard>
        <div className="p-5">
          <div className="mb-3 flex items-start justify-between">
            <Badge variant="outline" className={categoryColors[event.category] || ''}>
              {categoryLabels[event.category] || event.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
            </span>
          </div>

          <Link to={`/events/${event.id}`} className="group">
            <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {event.title}
            </h3>
          </Link>
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {event.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {event.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {event.currentParticipants}/{event.maxParticipants}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {event.organizerName || 'Organizer'}
            </span>
          </div>

          {event.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {event.tags.slice(0, 5).map((tag) => {
                const styles = getTagStyles(tag);
                return (
                  <Badge 
                    key={typeof tag === 'string' ? tag : tag.id} 
                    variant="outline" 
                    className={`text-[10px] transition-colors ${styles.className}`}
                    style={styles.style}
                  >
                    {typeof tag === 'string' ? tag : tag.name}
                  </Badge>
                );
              })}
              {event.tags.length > 5 && (
                <span className="text-[10px] text-muted-foreground">+{event.tags.length - 5} more</span>
              )}
            </div>
          ) : null}

          {/* Register link */}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <Link
              to={`/events/${event.id}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View details →
            </Link>
            {spotsLeft > 0 ? (
              <Link
                to={`/events/${event.id}?action=register`}
                className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Zap className="h-3 w-3" /> Register
              </Link>
            ) : (
              <span className="text-xs text-destructive font-medium">No spots</span>
            )}
          </div>
        </div>
      </ElectricCard>
    </motion.div>
  );
};

export default EventCard;
