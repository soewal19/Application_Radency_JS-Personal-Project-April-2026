/**
 * @module AI Assistant
 * @description A lightweight chat-like assistant that answers questions about the user's events.
 * Uses the backend AI endpoint to generate natural language responses based on current event data.
 */

import { useEffect, useMemo, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEventStore } from '@/store/useEventStore';
import { useAuthStore } from '@/store/useAuthStore';
import { socketService } from '@/services/socket';
import { Loader2, Send, BarChart3, Sparkles, User, Bot, Trash2, Terminal, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Chart } from 'react-google-charts';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  metadata?: {
    model: string;
    provider: string;
    limits: string;
  };
  toolCall?: {
    name: string;
    args: any;
    observation: any;
    agent?: string;
  };
}

const SUGGESTED_PROMPTS = [
  "What's my next event?",
  "Find tech workshops in Kyiv",
  "Create a coffee meetup for Friday at 10 AM",
  "Show my events statistics",
];

const buildContext = (events: string[]) => {
  if (!events.length) return 'No upcoming events in your calendar.';
  return `Here are your upcoming events:\n${events.slice(0, 10).join('\n')}`;
};

const buildEventsSummary = (events: any[]) => {
  const upcoming = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10)
    .map((e) => `- ${e.title} (${new Date(e.date).toLocaleString()}) [${(e.tags || []).join(', ')}]`);

  return buildEventsSummaryContext(upcoming);
};

const buildEventsSummaryContext = (events: string[]) => {
  if (!events.length) return 'No upcoming events in your calendar.';
  return `Here are your upcoming events:\n${events.slice(0, 10).join('\n')}`;
};

const pickChartData = (events: ReturnType<typeof useEventStore>['myEvents']) => {
  const byTag: Record<string, number> = {};
  
  if (events.length === 0) {
    // Default data for visual appeal if no events exist
    return [
      ['Tag', 'Event count'],
      ['Technology', 3],
      ['Music', 2],
      ['Art', 1],
      ['Sport', 2],
    ];
  }

  events.forEach((e) => {
    const tag = e.tags?.[0] ?? 'Other';
    byTag[tag] = (byTag[tag] ?? 0) + 1;
  });

  const rows = Object.entries(byTag).map(([tag, count]) => [tag, count]);
  return [['Tag', 'Event count'], ...rows];
};

const ToolCallInfo = ({ toolCall }: { toolCall: Message['toolCall'] }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!toolCall) return null;

  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/30 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Terminal className="h-3 w-3" />
          {toolCall.agent || 'Agent'} Tool: {toolCall.name}
        </span>
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border bg-black/5 p-3"
          >
            <div className="space-y-2">
              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">Arguments</div>
                <pre className="text-[10px] font-mono whitespace-pre-wrap text-blue-600 bg-blue-50/50 p-2 rounded">
                  {JSON.stringify(toolCall.args, null, 2)}
                </pre>
              </div>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">Observation</div>
                <pre className="text-[10px] font-mono whitespace-pre-wrap text-emerald-600 bg-emerald-50/50 p-2 rounded">
                  {JSON.stringify(toolCall.observation, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AIAssistant = () => {
  const { myEvents, fetchMyEvents } = useEventStore();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const context = useMemo(() => buildEventsSummary(myEvents), [myEvents]);

  const handleSubmit = async (overrideQuery?: string) => {
    const text = overrideQuery || query;
    if (!text.trim() || loading) return;

    setError(null);
    setLoading(true);
    setQuery('');
    
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    try {
      const result = await socketService.emit('aiQuery', { query: text, context });
      const assistantMsg: Message = { 
        role: 'assistant', 
        content: result.assistant ?? 'No response from assistant.',
        toolCall: result.toolCall,
        agent: result.agent,
        metadata: result.metadata
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      
      if (result.toolCall && ['createEvent', 'updateEvent', 'deleteEvent'].includes(result.toolCall.name)) {
        fetchMyEvents();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reach the assistant. Please try again.');
      logger.error('AI Assistant Query Error', 'AIAssistant', err);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  const chartData = useMemo(() => pickChartData(myEvents), [myEvents]);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Event Orchestrator
          </h1>
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" /> Clear chat
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your events with natural language. Search, create, update, or delete using the agent's tools.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card shadow-sm overflow-hidden h-[600px]">
          {/* Chat Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Welcome to Agent Hub</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                  I can help you orchestrate your events. Try one of the suggestions below.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  {SUGGESTED_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => handleSubmit(p)}
                      className="text-left text-xs p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border'
                }`}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                  {msg.role === 'assistant' && (msg.agent || msg.metadata) && (
                    <div className="flex flex-wrap items-center gap-3 mb-1.5 ml-1">
                      {msg.agent && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                          <Sparkles className="h-2.5 w-2.5" />
                          {msg.agent}
                        </span>
                      )}
                      {msg.metadata && (
                        <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tight">
                          <span className="bg-muted px-1.5 py-0.5 rounded border border-border/50">
                            {msg.metadata.model}
                          </span>
                          <span className="flex items-center gap-1">
                            <Info className="h-2.5 w-2.5" />
                            {msg.metadata.limits}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-muted/50 border border-border rounded-tl-none'
                  }`}>
                    {msg.content}
                    {msg.toolCall && <ToolCallInfo toolCall={{ ...msg.toolCall, agent: msg.agent }} />}
                  </div>
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted/30 border border-border rounded-2xl rounded-tl-none p-4 flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground font-medium animate-pulse">Agent is thinking...</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-muted/20">
            <div className="flex gap-2">
              <Input
                placeholder="Message Agent..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                className="bg-background border-border/50 focus-visible:ring-primary"
              />
              <Button onClick={() => handleSubmit()} disabled={loading || !query.trim()} className="shrink-0 gradient-primary">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            {error && <p className="mt-2 text-xs text-destructive flex items-center gap-1"><Info className="h-3 w-3" /> {error}</p>}
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Snapshot</h2>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-3 max-h-[200px] overflow-y-auto font-mono leading-relaxed">
              {context}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Distribution</h2>
            </div>
            <div className="h-[200px]">
              <Chart
                width="100%"
                height="100%"
                chartType="PieChart"
                loader={<div className="text-xs text-muted-foreground">Loading...</div>}
                data={chartData}
                options={{
                  pieHole: 0.5,
                  legend: { position: 'none' },
                  chartArea: { left: 10, top: 10, right: 10, bottom: 10 },
                  backgroundColor: 'transparent',
                  colors: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'],
                  animation: {
                    duration: 1000,
                    easing: 'out',
                    startup: true,
                  },
                }}
              />
            </div>
            <div className="mt-4 space-y-2">
              {chartData.slice(1, 4).map((row: any, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{row[0]}</span>
                  <span className="font-bold">{row[1]} events</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
