/**
 * @module Create Event Page
 * @description Page for creating a new event with form validation
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventStore } from '@/store/useEventStore';
import { EventCategory } from '@/types/event';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { z } from 'zod';

const eventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be under 100 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be under 1000 characters'),
  date: z
    .string()
    .min(1, 'Please select a date')
    .refine(val => new Date(val) > new Date(), 'Date must be in the future'),
  location: z
    .string()
    .trim()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must be under 100 characters'),
  category: z.nativeEnum(EventCategory),
  maxParticipants: z
    .number()
    .min(2, 'At least 2 participants')
    .max(10000, 'Maximum 10,000 participants'),
  tags: z
    .array(z.string().min(1).max(30))
    .max(5, 'Maximum 5 tags allowed')
    .optional(),
});

const CreateEvent = () => {
  const navigate = useNavigate();
  const { createEvent, isLoading } = useEventStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: EventCategory.MEETUP,
    maxParticipants: 50,
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = eventSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    await createEvent(form);
    navigate('/events');
  };

  const update = (field: string, value: string | number | string[]) => {
    setForm(f => ({ ...f, [field]: value }));
  };

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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Create Event</h1>

      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={e => update('title', e.target.value)} className="mt-1.5" placeholder="React Summit 2026" maxLength={100} />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={e => update('description', e.target.value)} className="mt-1.5" rows={4} placeholder="Tell us about the event..." maxLength={1000} />
            {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="date">Date & Time</Label>
              <Input id="date" type="datetime-local" value={form.date} onChange={e => update('date', e.target.value)} className="mt-1.5" />
              {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date}</p>}
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={e => update('location', e.target.value)} className="mt-1.5" placeholder="New York / Online" maxLength={100} />
              {errors.location && <p className="mt-1 text-xs text-destructive">{errors.location}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => update('category', v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="meetup">Meetup</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="sport">Sport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input id="maxParticipants" type="number" value={form.maxParticipants} onChange={e => update('maxParticipants', Number(e.target.value))} className="mt-1.5" min={2} max={10000} />
              {errors.maxParticipants && <p className="mt-1 text-xs text-destructive">{errors.maxParticipants}</p>}
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
            {errors.tags && <p className="mt-1 text-xs text-destructive">{errors.tags}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="gradient-primary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Event'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/events')}>Cancel</Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CreateEvent;
