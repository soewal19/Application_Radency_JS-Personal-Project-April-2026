/**
 * @module Event Details Page
 * @description Detailed view of a single event with registration, cancellation badge,
 * delete confirmation modal, and close button
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useEventStore } from '@/store/useEventStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, CalendarDays, MapPin, Users, User, Trash2, Edit2, Zap, X, Ban, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const categoryLabels: Record<string, string> = {
  conference: 'Conference', workshop: 'Workshop', meetup: 'Meetup',
  webinar: 'Webinar', social: 'Social', sport: 'Sport',
};

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentEvent, fetchEvent, joinEvent, leaveEvent, deleteEvent, isLoading } = useEventStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) fetchEvent(id);
  }, [id]);

  // Auto-register if ?action=register
  useEffect(() => {
    if (searchParams.get('action') === 'register' && currentEvent && id) {
      joinEvent(id);
      toast({ title: 'Registered!', description: `You've registered for "${currentEvent.title}".` });
    }
  }, [currentEvent?.id, searchParams]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => navigate('/events'), 300);
  };

  const handleCancelEvent = () => {
    setIsCancelled(true);
    toast({
      title: 'Event Cancelled',
      description: `"${currentEvent?.title}" has been marked as cancelled.`,
      variant: 'destructive',
    });
  };

  const handleConfirmDelete = async () => {
    if (!currentEvent) return;
    setIsDeleting(true);
    try {
      await deleteEvent(currentEvent.id);
      toast({ title: 'Event deleted', description: 'The event has been permanently deleted.' });
      navigate('/events');
    } catch {
      toast({ title: 'Error', description: 'Failed to delete event.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading || !currentEvent) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const isOrganizer = currentEvent.organizerId === user?.id;
  const date = new Date(currentEvent.date);
  const spotsLeft = currentEvent.maxParticipants - currentEvent.currentParticipants;

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto"
          >
            <Link to="/events" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to Events
            </Link>

            <div className="relative rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Close event details"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Cancelled overlay */}
              {isCancelled && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm"
                >
                  <div className="text-center">
                    <Ban className="mx-auto mb-3 h-12 w-12 text-destructive" />
                    <h2 className="text-2xl font-bold text-destructive">Event Cancelled</h2>
                    <p className="mt-2 text-sm text-muted-foreground">This event has been cancelled by the organizer.</p>
                    <Button variant="outline" className="mt-4" onClick={handleClose}>
                      Back to Events
                    </Button>
                  </div>
                </motion.div>
              )}

              <div className="mb-4 flex flex-wrap items-start justify-between gap-3 pr-8">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{categoryLabels[currentEvent.category]}</Badge>
                  {isCancelled && (
                    <Badge variant="destructive" className="gap-1">
                      <Ban className="h-3 w-3" /> Cancelled
                    </Badge>
                  )}
                </div>
                {isOrganizer && !isCancelled && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/events/${currentEvent.id}/edit`)}
                    >
                      <Edit2 className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEvent}
                      className="text-destructive hover:text-destructive"
                    >
                      <Ban className="mr-1 h-4 w-4" /> Cancel Event
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </div>
                )}
              </div>

              <h1 className={`mb-3 text-3xl font-bold text-foreground ${isCancelled ? 'line-through opacity-60' : ''}`}>
                {currentEvent.title}
              </h1>
              <p className={`mb-6 text-muted-foreground leading-relaxed ${isCancelled ? 'opacity-60' : ''}`}>
                {currentEvent.description}
              </p>

              <div className={`mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${isCancelled ? 'opacity-60' : ''}`}>
                {[
                  { icon: CalendarDays, label: 'Date', value: date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                  { icon: MapPin, label: 'Location', value: currentEvent.location },
                  { icon: Users, label: 'Participants', value: `${currentEvent.currentParticipants} / ${currentEvent.maxParticipants}` },
                  { icon: User, label: 'Organizer', value: currentEvent.organizerName },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-lg bg-muted/50 p-4">
                    <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </div>
                    <p className="text-sm font-medium text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              <div className={`mb-6 ${isCancelled ? 'opacity-60' : ''}`}>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Capacity</span>
                  <span>{Math.round((currentEvent.currentParticipants / currentEvent.maxParticipants) * 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full gradient-primary transition-all duration-500"
                    style={{ width: `${(currentEvent.currentParticipants / currentEvent.maxParticipants) * 100}%` }}
                  />
                </div>
              </div>

              {!isOrganizer && !isCancelled && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      joinEvent(currentEvent.id);
                      toast({ title: 'Registered!', description: `You've registered for "${currentEvent.title}".` });
                    }}
                    disabled={spotsLeft <= 0}
                    className="gradient-primary gap-2"
                  >
                    <Zap className="h-4 w-4" /> Register for Event
                  </Button>
                  <Button variant="outline" onClick={() => {
                    leaveEvent(currentEvent.id);
                    toast({ title: 'Left event', description: 'You have been unregistered.' });
                  }}>
                    Leave Event
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Delete Event</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete this event? This action cannot be undone and all participant data will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Yes, Delete Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventDetails;
