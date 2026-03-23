/**
 * @module Event Details Page
 * @description Detailed view of a single event with registration, cancellation badge,
 * delete confirmation modal, and close button
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useEventStore } from '@/store/useEventStore';
import { useAuthStore } from '@/store/useAuthStore';
import { socketService } from '@/services/socket';
import { Button } from '@/components/ui/button';
import type { IEvent, ITag } from '@/types/event';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  CalendarDays, 
  MapPin, 
  Users, 
  User, 
  Trash2, 
  Edit2, 
  Zap, 
  X, 
  Ban, 
  AlertTriangle, 
  Mail,
  Bot,
  Send,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const categoryLabels: Record<string, string> = {
  conference: 'Conference', workshop: 'Workshop', meetup: 'Meetup',
  webinar: 'Webinar', social: 'Social', sport: 'Sport',
};

const getTagStyles = (tag: ITag | string) => {
  const tagName = typeof tag === 'string' ? tag : tag.name;
  const tagColor = typeof tag === 'string' ? null : tag.color;

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
        backgroundColor: `${tagColor}1a`,
        color: tagColor,
        borderColor: `${tagColor}33`
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

  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return { className: colors[index], style: {} };
};

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentEvent, fetchEvent, joinEvent, leaveEvent, deleteEvent, updateEvent, registerSomeone, isLoading } = useEventStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRegisterSomeoneDialog, setShowRegisterSomeoneDialog] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // AI Concierge State
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiExpanded, setIsAiExpanded] = useState(false);

  useEffect(() => {
    if (id) fetchEvent(id);
  }, [id, fetchEvent]);

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiLoading || !currentEvent) return;

    const userMsg = { role: 'user' as const, content: aiInput.trim() };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setIsAiLoading(true);

    try {
      const response = await socketService.emit('aiQuery', {
        query: userMsg.content,
        eventId: currentEvent.id,
        context: `The user is currently viewing the details of "${currentEvent.title}".`
      });

      setAiMessages(prev => [...prev, { role: 'assistant', content: response.assistant }]);
    } catch (error) {
      toast({
        title: 'AI Error',
        description: 'Failed to get a response from the event concierge.',
        variant: 'destructive'
      });
    } finally {
      setIsAiLoading(false);
    }
  };

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

  const handleCancelEvent = async () => {
    try {
      await updateEvent(currentEvent!.id, { description: `[CANCELLED] ${currentEvent!.description}` });
      setIsCancelled(true);
      toast({
        title: 'Event Cancelled',
        description: `"${currentEvent?.title}" has been marked as cancelled.`,
        variant: 'destructive',
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to cancel event', variant: 'destructive' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentEvent) return;
    setIsDeleting(true);
    try {
      await deleteEvent(currentEvent.id);
      toast({ title: 'Event deleted', description: 'The event has been permanently deleted.' });
      navigate('/events');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete event', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegisterSomeone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail.trim() || !currentEvent) return;
    
    setIsRegistering(true);
    try {
      await registerSomeone(currentEvent.id, registerEmail.trim());
      toast({ 
        title: 'User Registered', 
        description: `Successfully registered ${registerEmail} for "${currentEvent.title}".` 
      });
      setShowRegisterSomeoneDialog(false);
      setRegisterEmail('');
    } catch (error: any) {
      toast({ 
        title: 'Registration Failed', 
        description: error.message || 'Make sure the user email is correct and they are not already registered.', 
        variant: 'destructive' 
      });
    } finally {
      setIsRegistering(false);
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto space-y-6"
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
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{categoryLabels[currentEvent.category]}</Badge>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span className={spotsLeft <= 5 ? 'text-destructive font-bold' : ''}>
                      {spotsLeft > 0 ? `${spotsLeft} spots remaining` : 'Event is full'}
                    </span>
                  </div>
                  {isCancelled && (
                    <Badge variant="destructive" className="gap-1">
                      <Ban className="h-3 w-3" /> Cancelled
                    </Badge>
                  )}
                </div>
              </div>

              <h1 className={`mb-3 text-3xl font-bold text-foreground ${isCancelled ? 'line-through opacity-60' : ''}`}>
                {currentEvent.title}
              </h1>

              {currentEvent.tags?.length ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  {currentEvent.tags.map((tag) => {
                    const styles = getTagStyles(tag);
                    return (
                      <Badge 
                        key={typeof tag === 'string' ? tag : tag.id} 
                        variant="outline" 
                        className={`text-[10px] uppercase tracking-widest ${styles.className}`}
                        style={styles.style}
                      >
                        {typeof tag === 'string' ? tag : tag.name}
                      </Badge>
                    );
                  })}
                </div>
              ) : null}

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

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border pt-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Zap className="h-4 w-4 text-primary" />
                    {isOrganizer ? 'Organizer Dashboard' : 'Event Participation'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isOrganizer 
                      ? 'You are managing this event' 
                      : spotsLeft > 0 
                        ? 'Spots are available for registration' 
                        : 'This event is currently full'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {isOrganizer && !isCancelled && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/events/${currentEvent.id}/edit`)}
                        className="flex-1 sm:flex-none"
                      >
                        <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEvent}
                        className="flex-1 sm:flex-none text-destructive hover:text-destructive hover:bg-destructive/5"
                      >
                        <Ban className="mr-1.5 h-3.5 w-3.5" /> Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                        className="flex-1 sm:flex-none shadow-sm"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                      </Button>
                    </>
                  )}

                  {!isCancelled && (
                    <Button
                      onClick={() => {
                        if (isOrganizer) {
                          setShowRegisterSomeoneDialog(true);
                        } else {
                          joinEvent(currentEvent.id);
                          toast({ 
                            title: 'Registered!', 
                            description: `You've registered for "${currentEvent.title}".` 
                          });
                        }
                      }}
                      disabled={spotsLeft <= 0}
                      className={`flex-1 sm:flex-none gap-2 shadow-lg shadow-primary/20 ${isOrganizer ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'gradient-primary'}`}
                    >
                      <Zap className="h-4 w-4" /> 
                      {isOrganizer ? 'Register Someone Else' : 'Register for Event'}
                    </Button>
                  )}

                  {!isOrganizer && !isCancelled && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        leaveEvent(currentEvent.id);
                        toast({ title: 'Left event', description: 'You have been unregistered.' });
                      }}
                      className="flex-1 sm:flex-none"
                    >
                      <X className="mr-1.5 h-3.5 w-3.5" /> Leave
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Event Concierge AI */}
            <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="bg-primary/5 px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight">Event Concierge</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Powered by AI Agent</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary font-bold text-xs"
                  onClick={() => setIsAiExpanded(!isAiExpanded)}
                >
                  {isAiExpanded ? 'Hide Concierge' : 'Talk to Concierge'}
                </Button>
              </div>

              <AnimatePresence>
                {isAiExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-4">
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                          {aiMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-60">
                              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                              <p className="text-sm font-medium">Hello! I'm the personal assistant for this event. <br/> How can I help you today?</p>
                            </div>
                          ) : (
                            aiMessages.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                                  msg.role === 'user' 
                                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                    : 'bg-muted text-foreground rounded-tl-none'
                                }`}>
                                  {msg.content}
                                </div>
                              </div>
                            ))
                          )}
                          {isAiLoading && (
                            <div className="flex justify-start">
                              <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-2.5">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>

                      <form onSubmit={handleAiQuery} className="flex gap-2 pt-2">
                        <Input
                          placeholder="Ask about location, schedule, or register..."
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          disabled={isAiLoading}
                          className="bg-muted/50 border-transparent focus:border-primary rounded-xl"
                        />
                        <Button type="submit" disabled={isAiLoading || !aiInput.trim()} className="rounded-xl gradient-primary aspect-square p-0">
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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

      {/* Register Someone Else Dialog */}
      <Dialog open={showRegisterSomeoneDialog} onOpenChange={setShowRegisterSomeoneDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleRegisterSomeone}>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-center">Register Participant</DialogTitle>
              <DialogDescription className="text-center">
                Enter the email address of the user you want to register for this event.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">User Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    className="pl-10"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowRegisterSomeoneDialog(false)}
                disabled={isRegistering}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="gradient-primary"
                disabled={isRegistering}
              >
                {isRegistering ? 'Registering...' : 'Register User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventDetails;
