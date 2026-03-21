/**
 * @module Edit Event Page
 * @description Edit an existing event (organizer only)
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventStore } from '@/store/useEventStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { EventCategory } from '@/types/event';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentEvent, fetchEvent, isLoading, updateEvent } = useEventStore();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'meetup',
    maxParticipants: 50,
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (id) fetchEvent(id);
  }, [id]);

  useEffect(() => {
    if (currentEvent) {
      setForm({
        title: currentEvent.title,
        description: currentEvent.description,
        date: currentEvent.date.slice(0, 16),
        location: currentEvent.location,
        category: currentEvent.category,
        maxParticipants: currentEvent.maxParticipants,
        tags: currentEvent.tags ?? [],
      });
    }
  }, [currentEvent]);

  const addTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    if (form.tags.includes(value)) return;
    if (form.tags.length >= 5) return;
    setForm(f => ({ ...f, tags: [...f.tags, value] }));
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm(f => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await updateEvent(id, {
        ...form,
        date: form.date,
      });
      toast({ title: 'Event updated', description: `"${form.title}" has been updated successfully.` });
      navigate(`/events/${id}`);
    } catch {
      toast({ title: 'Failed to update event', variant: 'destructive' });
    }
  };

  if (isLoading || !currentEvent) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-6 text-2xl font-bold text-foreground">Edit Event</h1>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="date">Date & Time</Label>
            <Input id="date" type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(EventCategory).map(c => (
                  <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="max">Max Participants</Label>
            <Input id="max" type="number" min={1} value={form.maxParticipants} onChange={e => setForm(f => ({ ...f, maxParticipants: +e.target.value }))} required />
          </div>
        </div>

        <div>
          <Label htmlFor="tags">Tags (optional)</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {form.tags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => removeTag(tag)}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-foreground hover:bg-muted/80"
              >
                {tag}
                <span aria-hidden>×</span>
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              id="tags"
              placeholder="Add tag and press Enter"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button type="button" onClick={addTag} className="text-sm">
              Add
            </Button>
          </div>
        </div>
        <Button type="submit" className="w-full gradient-primary gap-2">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </form>
    </div>
  );
};

export default EditEvent;
