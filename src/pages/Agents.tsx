import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot, Plus, Trash2, Zap, User, ExternalLink, BrainCircuit, X, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface Knowledge {
  id: string;
  content: string;
  createdAt: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  parameters: string;
  isThirdParty: boolean;
  sourceUrl?: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  userId: string | null;
  skills: Skill[];
  knowledge: Knowledge[];
}

const Agents = () => {
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals state
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Form states
  const [agentForm, setAgentForm] = useState({
    name: '',
    role: '',
    systemPrompt: '',
    skillIds: [] as string[],
  });

  const [skillForm, setSkillForm] = useState({
    name: '',
    description: '',
    parameters: '{"param": "type"}',
    isThirdParty: false,
    sourceUrl: '',
  });

  const [knowledgeForm, setKnowledgeForm] = useState({
    content: '',
  });

  // Mock data for demo
  const mockAgents: Agent[] = [
    {
      id: 'agent-1',
      name: 'Discovery Scout',
      role: 'Event Search Specialist',
      systemPrompt: 'You are the Discovery Scout. You specialize in finding the perfect events for users.',
      userId: null,
      skills: [],
      knowledge: [],
    },
    {
      id: 'agent-2',
      name: 'Event Manager',
      role: 'Operations Specialist',
      systemPrompt: 'You are the Event Manager. You handle the heavy lifting of creating, modifying, and deleting events.',
      userId: null,
      skills: [],
      knowledge: [],
    },
    {
      id: 'agent-3',
      name: 'Data Insight',
      role: 'Analytics Specialist',
      systemPrompt: 'You are Data Insight. You turn raw event data into meaningful statistics.',
      userId: null,
      skills: [],
      knowledge: [],
    },
    {
      id: 'agent-4',
      name: 'Social Connect',
      role: 'Community Manager',
      systemPrompt: 'You are Social Connect. You help users connect with others and build communities.',
      userId: null,
      skills: [],
      knowledge: [],
    },
  ];

  const mockSkills: Skill[] = [
    { id: 'skill-1', name: 'searchEvents', description: 'Search for events', parameters: '{}', isThirdParty: false },
    { id: 'skill-2', name: 'createEvent', description: 'Create new event', parameters: '{}', isThirdParty: false },
    { id: 'skill-3', name: 'getEventsStats', description: 'Get event statistics', parameters: '{}', isThirdParty: false },
    { id: 'skill-4', name: 'updateEvent', description: 'Update event', parameters: '{}', isThirdParty: false },
    { id: 'skill-5', name: 'deleteEvent', description: 'Delete event', parameters: '{}', isThirdParty: false },
  ];

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [agentsRes, skillsRes] = await Promise.all([
        apiService.request<Agent[]>('/agents'),
        apiService.request<Skill[]>('/agents/skills'),
      ]);
      setAgents(agentsRes?.length > 0 ? agentsRes : mockAgents);
      setAvailableSkills(skillsRes?.length > 0 ? skillsRes : mockSkills);
    } catch (error: any) {
      console.error('Failed to fetch agents data:', error);
      // Use mock data on error
      setAgents(mockAgents);
      setAvailableSkills(mockSkills);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.request('/agents', {
        method: 'POST',
        body: JSON.stringify(agentForm),
      });
      toast.success('Agent created successfully');
      setIsAgentModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create agent');
    }
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.request('/agents/skills', {
        method: 'POST',
        body: JSON.stringify(skillForm),
      });
      toast.success('Skill created successfully');
      setIsSkillModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create skill');
    }
  };

  const handleAddKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) return;
    try {
      await apiService.request(`/agents/${selectedAgentId}/knowledge`, {
        method: 'POST',
        body: JSON.stringify(knowledgeForm),
      });
      toast.success('Knowledge added to agent');
      setIsKnowledgeModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to add knowledge');
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      await apiService.request(`/agents/${id}`, { method: 'DELETE' });
      setAgents(agents.filter(a => a.id !== id));
      toast.success('Agent deleted');
    } catch (error) {
      toast.error('Failed to delete agent');
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    try {
      await apiService.request(`/agents/knowledge/${id}`, { method: 'DELETE' });
      toast.success('Knowledge entry removed');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove knowledge');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Swarm & MLOps</h1>
          <p className="text-muted-foreground">Orchestrate specialized agents, train them with RAG, and manage dynamic skills.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSkillModalOpen} onOpenChange={setIsSkillModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Zap className="h-4 w-4" />
                Create Skill
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateSkill}>
                <DialogHeader>
                  <DialogTitle>New Agent Skill (Tool)</DialogTitle>
                  <DialogDescription>Define a function that agents can call to interact with external systems.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="skill-name">Name (e.g. get_weather)</Label>
                    <Input id="skill-name" value={skillForm.name} onChange={e => setSkillForm({...skillForm, name: e.target.value})} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="skill-desc">Description</Label>
                    <Textarea id="skill-desc" value={skillForm.description} onChange={e => setSkillForm({...skillForm, description: e.target.value})} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="skill-params">Parameters (JSON Schema)</Label>
                    <Textarea id="skill-params" value={skillForm.parameters} onChange={e => setSkillForm({...skillForm, parameters: e.target.value})} required />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="third-party" checked={skillForm.isThirdParty} onCheckedChange={(checked) => setSkillForm({...skillForm, isThirdParty: !!checked})} />
                    <Label htmlFor="third-party">Third-party Skill (External source)</Label>
                  </div>
                  {skillForm.isThirdParty && (
                    <div className="grid gap-2">
                      <Label htmlFor="source-url">Source URL</Label>
                      <Input id="source-url" value={skillForm.sourceUrl} onChange={e => setSkillForm({...skillForm, sourceUrl: e.target.value})} placeholder="https://..." />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit">Register Skill</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAgentModalOpen} onOpenChange={setIsAgentModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleCreateAgent}>
                <DialogHeader>
                  <DialogTitle>Assemble New Agent</DialogTitle>
                  <DialogDescription>Configure the identity, role, and capabilities of your new AI worker.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="agent-name">Agent Name</Label>
                      <Input id="agent-name" value={agentForm.name} onChange={e => setAgentForm({...agentForm, name: e.target.value})} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="agent-role">Role / Specialty</Label>
                      <Input id="agent-role" value={agentForm.role} onChange={e => setAgentForm({...agentForm, role: e.target.value})} required />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="agent-prompt">System Prompt (Instructions)</Label>
                    <Textarea id="agent-prompt" className="h-32" value={agentForm.systemPrompt} onChange={e => setAgentForm({...agentForm, systemPrompt: e.target.value})} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Assign Skills (Tools)</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-md border p-3">
                      {availableSkills.map(skill => (
                        <div key={skill.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`skill-${skill.id}`} 
                            checked={agentForm.skillIds.includes(skill.id)}
                            onCheckedChange={(checked) => {
                              if (checked) setAgentForm({...agentForm, skillIds: [...agentForm.skillIds, skill.id]});
                              else setAgentForm({...agentForm, skillIds: agentForm.skillIds.filter(id => id !== skill.id)});
                            }}
                          />
                          <Label htmlFor={`skill-${skill.id}`} className="text-xs">{skill.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Deploy Agent</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-32 bg-muted/20" />
              <CardContent className="h-32" />
            </Card>
          ))
        ) : error ? (
          <Alert variant="destructive" className="col-span-full">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 ml-2"
                onClick={fetchData}
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : agents.length === 0 ? (
          <Card className="col-span-full border-muted bg-muted/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>No Agents Found</CardTitle>
              <CardDescription>
                Create your first AI agent to get started with the swarm orchestration.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => setIsAgentModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Agent
              </Button>
            </CardContent>
          </Card>
        ) : (
          agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full border-primary/10 bg-card hover:border-primary/30 transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    {agent.userId ? (
                      <Badge variant="outline" className="gap-1">
                        <User className="h-3 w-3" />
                        Custom
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        System
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-4">{agent.name}</CardTitle>
                  <CardDescription>{agent.role}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground line-clamp-3 italic">
                    "{agent.systemPrompt}"
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Capabilities
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.skills.map(skill => (
                        <Badge key={skill.id} variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[10px]">
                          {skill.name}
                          {skill.isThirdParty && <ExternalLink className="ml-1 h-2 w-2 opacity-50" />}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                        <BrainCircuit className="h-3 w-3" /> Knowledge Base
                      </p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full"
                        onClick={() => {
                          setSelectedAgentId(agent.id);
                          setIsKnowledgeModalOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {agent.knowledge?.length > 0 ? (
                        agent.knowledge.slice(0, 2).map(k => (
                          <div key={k.id} className="group relative rounded bg-muted/50 p-2 text-[10px] text-muted-foreground">
                            <span className="line-clamp-2">{k.content}</span>
                            <button 
                              onClick={() => handleDeleteKnowledge(k.id)}
                              className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3 text-destructive" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-muted-foreground italic text-center py-2">No training data yet</p>
                      )}
                      {agent.knowledge?.length > 2 && (
                        <p className="text-center text-[10px] font-medium text-primary">
                          + {agent.knowledge.length - 2} more entries
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between">
                  <span className="text-xs text-muted-foreground">
                    {agent.skills.length} skills · {agent.knowledge?.length || 0} training items
                  </span>
                  {agent.userId === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteAgent(agent.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={isKnowledgeModalOpen} onOpenChange={setIsKnowledgeModalOpen}>
        <DialogContent>
          <form onSubmit={handleAddKnowledge}>
            <DialogHeader>
              <DialogTitle>Train Agent (RAG)</DialogTitle>
              <DialogDescription>Add context, documents, or rules to this agent's persistent memory.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="knowledge-content">Knowledge Entry (Markdown/Text)</Label>
                <Textarea 
                  id="knowledge-content" 
                  className="h-48" 
                  placeholder="Paste rules, facts, or instructions here..."
                  value={knowledgeForm.content}
                  onChange={e => setKnowledgeForm({content: e.target.value})}
                  required 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="gap-2">
                <BrainCircuit className="h-4 w-4" />
                Add to Memory
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agents;
