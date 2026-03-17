/**
 * @module My Events / Profile Page
 * @description Personal cabinet with avatar upload, profile info, calendar views, and event management
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useEventStore } from '@/store/useEventStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays, MapPin, Plus, Edit2, Trash2, Users,
  Camera, Mail, Clock, Settings, ChevronRight, TrendingUp, BarChart3,
  ChevronLeft, List, LayoutGrid
} from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import type { IEvent } from '@/types/event';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

type CalendarView = 'monthly' | 'weekly' | 'list';

const getMonthDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Date[] = [];
  for (let i = firstDay - 1; i >= 0; i--) days.push(new Date(year, month, -i));
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  while (days.length < 42) days.push(new Date(year, month + 1, days.length - firstDay - daysInMonth + 1));
  return days;
};

const getWeekDays = (date: Date) => {
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(start.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const MyEvents = () => {
  const { myEvents, fetchMyEvents, deleteEvent, isLoading } = useEventStore();
  const { user, updateAvatar, updateProfile } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');
  const [editEmail, setEditEmail] = useState(user?.email ?? '');
  const [calendarView, setCalendarView] = useState<CalendarView>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createdPage, setCreatedPage] = useState(1);
  const [registeredPage, setRegisteredPage] = useState(1);

  const EVENTS_PER_PAGE = 8;

  const buildPageNums = (current: number, total: number): (number | '...')[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  };

  const renderPagination = (currentPage: number, totalPages: number, onChange: (p: number) => void, total: number) => {
    if (total <= EVENTS_PER_PAGE) return null;
    const start = (currentPage - 1) * EVENTS_PER_PAGE + 1;
    const end = Math.min(currentPage * EVENTS_PER_PAGE, total);
    return (
      <div className="mt-4 flex flex-col items-center gap-2">
        <p className="text-xs text-muted-foreground">Showing {start}–{end} of {total} events</p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 1) onChange(currentPage - 1); }}
                aria-disabled={currentPage === 1} className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''} />
            </PaginationItem>
            {buildPageNums(currentPage, totalPages).map((page, i) =>
              page === '...' ? (
                <PaginationItem key={`e-${i}`}><PaginationEllipsis /></PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink href="#" isActive={page === currentPage}
                    onClick={(e) => { e.preventDefault(); onChange(page as number); }}>{page}</PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) onChange(currentPage + 1); }}
                aria-disabled={currentPage === totalPages} className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  useEffect(() => { fetchMyEvents(); }, []);
  useEffect(() => { if (user) { setEditName(user.name); setEditEmail(user.email); } }, [user]);

  const createdEvents = useMemo(
    () => myEvents.filter(e => e.organizerId === user?.id || e.organizerName === 'You'),
    [myEvents, user]
  );
  const registeredEvents = useMemo(
    () => myEvents.filter(e => e.organizerId !== user?.id && e.organizerName !== 'You'),
    [myEvents, user]
  );

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > MAX_AVATAR_SIZE) { toast.error('Image must be less than 2MB'); return; }
    logger.info('Avatar upload started', 'Profile', { size: file.size, type: file.type });
    try {
      const { compressImageToBase64 } = await import('@/lib/image-utils');
      const compressed = await compressImageToBase64(file);
      updateAvatar(compressed);
      toast.success('Avatar updated successfully');
    } catch {
      toast.error('Failed to process image');
    }
  }, [updateAvatar]);

  const handleSaveProfile = () => {
    if (!editName.trim()) { toast.error('Name cannot be empty'); return; }
    updateProfile({ name: editName.trim(), email: editEmail.trim() });
    setIsEditing(false);
    toast.success('Profile updated');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  const EventSkeleton = () => (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div>
      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  );

  const renderEventRow = (event: typeof myEvents[0], i: number, showActions: boolean) => {
    const date = new Date(event.date);
    return (
      <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.04, duration: 0.3 }}
        className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-card hover:border-primary/20"
      >
        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span className="text-lg font-bold leading-none">{date.getDate()}</span>
          <span className="text-[10px] uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
        </div>
        <Link to={`/events/${event.id}`} className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">{event.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.currentParticipants}/{event.maxParticipants}</span>
          </div>
        </Link>
        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => navigate(`/events/${event.id}/edit`)}><Edit2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteEvent(event.id).then(() => fetchMyEvents())}><Trash2 className="h-4 w-4" /></Button>
          </div>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      </motion.div>
    );
  };

  const navigateCalendar = (direction: number) => {
    const d = new Date(currentDate);
    if (calendarView === 'monthly') d.setMonth(d.getMonth() + direction);
    else d.setDate(d.getDate() + direction * 7);
    setCurrentDate(d);
  };

  const getEventsForDay = (day: Date): IEvent[] =>
    myEvents.filter(e => isSameDay(new Date(e.date), day));

  const today = new Date();

  const renderMonthlyCalendar = () => {
    const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
    const currentMonth = currentDate.getMonth();
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS_OF_WEEK.map(d => (
            <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const events = getEventsForDay(day);
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday_ = isSameDay(day, today);
            return (
              <div key={i} className={`min-h-[80px] border-b border-r border-border p-1.5 transition-colors ${!isCurrentMonth ? 'bg-muted/30' : 'hover:bg-muted/50'} ${isToday_ ? 'bg-primary/5' : ''}`}>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${isToday_ ? 'bg-primary text-primary-foreground font-bold' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                  {day.getDate()}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {events.slice(0, 2).map(evt => (
                    <Link key={evt.id} to={`/events/${evt.id}`} className="block truncate rounded px-1 py-0.5 text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                      {evt.title}
                    </Link>
                  ))}
                  {events.length > 2 && <span className="block text-[10px] text-muted-foreground pl-1">+{events.length - 2} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeeklyCalendar = () => {
    const weekDays = getWeekDays(currentDate);
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
          <div className="border-r border-border" />
          {weekDays.map((day, i) => {
            const isToday_ = isSameDay(day, today);
            return (
              <div key={i} className={`px-2 py-3 text-center border-r border-border last:border-r-0 ${isToday_ ? 'bg-primary/5' : ''}`}>
                <div className="text-xs text-muted-foreground">{DAYS_OF_WEEK[i]}</div>
                <div className={`text-sm font-semibold ${isToday_ ? 'text-primary' : 'text-foreground'}`}>{day.getDate()}</div>
              </div>
            );
          })}
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border last:border-b-0">
              <div className="border-r border-border px-2 py-3 text-right text-[11px] text-muted-foreground">{hour}:00</div>
              {weekDays.map((day, di) => {
                const dayEvents = getEventsForDay(day).filter(e => new Date(e.date).getHours() === hour);
                return (
                  <div key={di} className="relative border-r border-border last:border-r-0 min-h-[48px] p-0.5">
                    {dayEvents.map(evt => (
                      <Link key={evt.id} to={`/events/${evt.id}`} className="block truncate rounded px-1.5 py-1 text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors mb-0.5">
                        {evt.title}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const calendarTitle = calendarView === 'monthly'
    ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : `Week of ${getWeekDays(currentDate)[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${getWeekDays(currentDate)[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="space-y-8">
      {/* Profile Header Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <div className="h-32 gradient-primary opacity-90" />
        <div className="relative px-6 pb-6">
          <div className="relative -mt-16 mb-4 flex items-end justify-between">
            <div className="relative group">
              <Avatar className="h-28 w-28 border-4 border-card shadow-elevated">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="text-2xl font-bold bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/0 group-hover:bg-foreground/40 transition-colors cursor-pointer" aria-label="Upload avatar">
                <Camera className="h-6 w-6 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} className="hidden" />
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button size="sm" className="gradient-primary" onClick={handleSaveProfile}>Save</Button>
                </>
              ) : (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditing(true)}>
                  <Settings className="h-3.5 w-3.5" /> Edit Profile
                </Button>
              )}
            </div>
          </div>
          {isEditing ? (
            <div className="space-y-3 max-w-md">
              <div><Label htmlFor="edit-name" className="text-xs text-muted-foreground">Name</Label><Input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} className="mt-1" /></div>
              <div><Label htmlFor="edit-email" className="text-xs text-muted-foreground">Email</Label><Input id="edit-email" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="mt-1" /></div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-foreground">{user?.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {user?.email}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Member since {memberSince}</span>
              </div>
            </div>
          )}
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { label: 'Created', value: createdEvents.length, color: 'bg-primary/10 text-primary' },
              { label: 'Registered', value: registeredEvents.length, color: 'bg-accent/10 text-accent' },
              { label: 'Total', value: myEvents.length, color: 'bg-secondary text-secondary-foreground' },
            ].map(stat => (
              <div key={stat.label} className={`rounded-xl p-4 text-center ${stat.color}`}>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs opacity-70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Activity Charts */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold text-foreground">Monthly Activity</h3></div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={(() => {
              const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              return months.map((month, i) => {
                const created = myEvents.filter(e => new Date(e.date).getMonth() === i).length;
                return { month, events: created, participants: Math.floor(created * 12 + Math.random() * 20) };
              });
            })()}>
              <defs>
                <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(245, 58%, 51%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(245, 58%, 51%)" stopOpacity={0} /></linearGradient>
                <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(165, 60%, 40%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(165, 60%, 40%)" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 88%)" strokeOpacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 88%)', borderRadius: '0.75rem', fontSize: 12 }} />
              <Area type="monotone" dataKey="events" stroke="hsl(245, 58%, 51%)" strokeWidth={2} fill="url(#colorEvents)" animationDuration={1200} />
              <Area type="monotone" dataKey="participants" stroke="hsl(165, 60%, 40%)" strokeWidth={2} fill="url(#colorParticipants)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: 'hsl(245, 58%, 51%)' }} /> Events</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: 'hsl(165, 60%, 40%)' }} /> Participants</span>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /><h3 className="text-sm font-semibold text-foreground">Category Breakdown</h3></div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie data={(() => { const cats: Record<string,number> = {}; myEvents.forEach(e => { cats[e.category] = (cats[e.category]||0)+1; }); return Object.entries(cats).map(([name,value]) => ({name,value})); })()} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" animationDuration={1000}>
                  {(() => { const COLORS = ['hsl(245, 58%, 51%)','hsl(165, 60%, 40%)','hsl(38, 92%, 50%)','hsl(0, 72%, 51%)','hsl(280, 60%, 55%)','hsl(200, 60%, 45%)']; const cats: Record<string,number> = {}; myEvents.forEach(e => { cats[e.category] = (cats[e.category]||0)+1; }); return Object.keys(cats).map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />); })()}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 88%)', borderRadius: '0.75rem', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {(() => { const COLORS = ['hsl(245, 58%, 51%)','hsl(165, 60%, 40%)','hsl(38, 92%, 50%)','hsl(0, 72%, 51%)','hsl(280, 60%, 55%)','hsl(200, 60%, 45%)']; const cats: Record<string,number> = {}; myEvents.forEach(e => { cats[e.category] = (cats[e.category]||0)+1; }); return Object.entries(cats).map(([name,value],i) => (
                <div key={name} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: COLORS[i%COLORS.length] }} /><span className="capitalize text-foreground">{name}</span><span className="ml-auto font-medium text-muted-foreground">{value}</span></div>
              )); })()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Calendar Section */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-foreground">My Calendar</h2>
          <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
            {([
              { value: 'monthly' as CalendarView, icon: LayoutGrid, label: 'Month' },
              { value: 'weekly' as CalendarView, icon: CalendarDays, label: 'Week' },
              { value: 'list' as CalendarView, icon: List, label: 'List' },
            ]).map(v => (
              <button key={v.value} onClick={() => setCalendarView(v.value)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${calendarView === v.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                <v.icon className="h-3.5 w-3.5" />{v.label}
              </button>
            ))}
          </div>
        </div>

        {calendarView !== 'list' && (
          <div className="mb-4 flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateCalendar(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <h3 className="text-sm font-semibold text-foreground min-w-[200px] text-center">{calendarTitle}</h3>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateCalendar(1)}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCurrentDate(new Date())}>Today</Button>
          </div>
        )}

        {calendarView === 'monthly' && renderMonthlyCalendar()}
        {calendarView === 'weekly' && renderWeeklyCalendar()}
      </motion.div>

      {/* Events List Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">My Events</h2>
          <Button onClick={() => navigate('/events/create')} size="sm" className="gradient-primary gap-2"><Plus className="h-4 w-4" /> Create Event</Button>
        </div>
        <Tabs defaultValue="created">
          <TabsList className="mb-4">
            <TabsTrigger value="created">Created ({createdEvents.length})</TabsTrigger>
            <TabsTrigger value="registered">Registered ({registeredEvents.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="created">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <EventSkeleton key={i} />)}</div>
            ) : createdEvents.length === 0 ? (
              <div className="flex min-h-[20vh] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-muted-foreground">
                <CalendarDays className="mb-3 h-10 w-10 opacity-40" /><p className="text-sm">You haven't created any events yet</p>
                <Button variant="link" size="sm" onClick={() => navigate('/events/create')}>Create your first event</Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {createdEvents
                    .slice((createdPage - 1) * EVENTS_PER_PAGE, createdPage * EVENTS_PER_PAGE)
                    .map((e, i) => renderEventRow(e, i, true))}
                </div>
                {renderPagination(createdPage, Math.ceil(createdEvents.length / EVENTS_PER_PAGE), setCreatedPage, createdEvents.length)}
              </>
            )}
          </TabsContent>
          <TabsContent value="registered">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <EventSkeleton key={i} />)}</div>
            ) : registeredEvents.length === 0 ? (
              <div className="flex min-h-[20vh] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-muted-foreground">
                <Users className="mb-3 h-10 w-10 opacity-40" /><p className="text-sm">You are not part of any events yet. Explore public events and join.</p>
                <Button variant="link" size="sm" onClick={() => navigate('/events')}>Browse events</Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {registeredEvents
                    .slice((registeredPage - 1) * EVENTS_PER_PAGE, registeredPage * EVENTS_PER_PAGE)
                    .map((e, i) => renderEventRow(e, i, false))}
                </div>
                {renderPagination(registeredPage, Math.ceil(registeredEvents.length / EVENTS_PER_PAGE), setRegisteredPage, registeredEvents.length)}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyEvents;