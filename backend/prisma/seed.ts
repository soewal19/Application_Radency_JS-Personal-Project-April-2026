/**
 * @module Prisma Seed
 * @description Seeds the database with test user and sample events
 * Run: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const hashedPassword = await bcrypt.hash('Test1234', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'testuser@test.com' },
    update: {},
    create: {
      email: 'testuser@test.com',
      name: 'Test User',
      password: hashedPassword,
    },
  });
  console.log(`✅ Test user: ${testUser.email} / Test1234`);

  // Create sample events
  const categories = ['conference', 'workshop', 'meetup', 'webinar', 'social', 'sport', 'music', 'art', 'food', 'tech'];
  const locations = ['Amsterdam', 'Berlin', 'London', 'New York', 'Tokyo', 'Paris', 'Sydney', 'Toronto', 'San Francisco', 'Online', 'Dubai', 'Singapore', 'Barcelona', 'Rome', 'Vienna'];
  
  // First create tags with colors
  const tagsWithColors = [
    { name: 'tech', color: '#6366f1' },
    { name: 'music', color: '#ec4899' },
    { name: 'art', color: '#a855f7' },
    { name: 'sport', color: '#f97316' },
    { name: 'food', color: '#22c55e' },
    { name: 'business', color: '#3b82f6' },
    { name: 'charity', color: '#ef4444' },
    { name: 'health', color: '#14b8a6' },
    { name: 'education', color: '#eab308' },
    { name: 'social', color: '#06b6d4' },
    { name: 'AI', color: '#f59e0b' },
    { name: 'React', color: '#61dafb' },
    { name: 'JavaScript', color: '#f7df1e' },
    { name: 'Backend', color: '#ff4500' },
    { name: 'ai-generated', color: '#8b5cf6' },
  ];

  const createdTags = await Promise.all(
    tagsWithColors.map(async (tag) => {
      return prisma.tag.upsert({
        where: { normalized: tag.name.toLowerCase() },
        update: { color: tag.color },
        create: { name: tag.name, normalized: tag.name.toLowerCase(), color: tag.color },
      });
    })
  );
  console.log(`✅ Created/updated ${createdTags.length} tags with colors`);

  const eventTitles = [
    { title: 'React Summit 2026', description: 'Annual React conference with top speakers from around the world', category: 'tech', maxParticipants: 500, tags: ['tech', 'education'] },
    { title: 'TypeScript Workshop', description: 'Hands-on workshop covering advanced TypeScript patterns and practices', category: 'tech', maxParticipants: 30, tags: ['tech', 'education'] },
    { title: 'Node.js Meetup', description: 'Monthly meetup for Node.js developers to share experiences', category: 'tech', maxParticipants: 50, tags: ['tech', 'social'] },
    { title: 'DevOps Webinar', description: 'Deep dive into CI/CD pipelines and infrastructure as code', category: 'tech', maxParticipants: 200, tags: ['tech'] },
    { title: 'Tech Social Night', description: 'Networking evening for tech professionals and enthusiasts', category: 'social', maxParticipants: 100, tags: ['social', 'tech'] },
    { title: 'AI Conference 2026', description: 'Explore the latest advancements in artificial intelligence and machine learning', category: 'tech', maxParticipants: 300, tags: ['tech', 'education'] },
    { title: 'Yoga in the Park', description: 'Start your morning with energizing yoga session outdoors', category: 'sport', maxParticipants: 40, tags: ['sport', 'health'] },
    { title: 'Jazz Night', description: 'Live jazz performance featuring local musicians', category: 'music', maxParticipants: 80, tags: ['music', 'art'] },
    { title: 'Art Gallery Opening', description: 'Grand opening of contemporary art exhibition', category: 'art', maxParticipants: 150, tags: ['art', 'social'] },
    { title: 'Food Festival', description: 'International cuisine tasting event with 50+ vendors', category: 'food', maxParticipants: 500, tags: ['food', 'social'] },
    { title: 'Startup Pitch Night', description: 'Watch startups pitch to top investors', category: 'tech', maxParticipants: 200, tags: ['tech', 'business'] },
    { title: 'Photography Walk', description: 'Guided photography tour through historic city landmarks', category: 'art', maxParticipants: 25, tags: ['art'] },
    { title: 'Cooking Masterclass', description: 'Learn to cook authentic Italian cuisine from a master chef', category: 'food', maxParticipants: 20, tags: ['food', 'education'] },
    { title: 'Hackathon 2026', description: '24-hour coding marathon with amazing prizes', category: 'tech', maxParticipants: 150, tags: ['tech'] },
    { title: 'Book Club Meeting', description: 'Monthly discussion on the latest best-selling novels', category: 'social', maxParticipants: 30, tags: ['social', 'education'] },
    { title: 'Marathon Training Run', description: 'Group training session for upcoming marathon', category: 'sport', maxParticipants: 100, tags: ['sport', 'health'] },
    { title: 'Classical Concert', description: 'Orchestra performance of Beethoven and Mozart', category: 'music', maxParticipants: 250, tags: ['music', 'art'] },
    { title: 'Crypto Workshop', description: 'Understanding blockchain technology and cryptocurrency', category: 'tech', maxParticipants: 75, tags: ['tech', 'business'] },
    { title: 'Street Food Market', description: 'Various street food trucks and vendors', category: 'food', maxParticipants: 400, tags: ['food'] },
    { title: 'Wine Tasting Evening', description: 'Premium wine tasting experience with sommeliers', category: 'food', maxParticipants: 40, tags: ['food', 'social'] },
  ];

  for (const e of eventTitles) {
    const eventTags = createdTags.filter(t => e.tags.includes(t.name));
    await prisma.event.create({
      data: {
        title: e.title,
        description: e.description,
        category: e.category,
        maxParticipants: e.maxParticipants,
        location: locations[Math.floor(Math.random() * locations.length)],
        date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
        organizerId: testUser.id,
        organizerName: testUser.name,
        tags: {
          connect: eventTags.map(t => ({ id: t.id })),
        },
      },
    });
  }
  console.log(`✅ Created ${eventTitles.length} sample events with tags`);

  // Create initial Skills (Tools)
  const skills = [
    { name: 'searchEvents', description: 'Search for events by city, date, or category.', parameters: JSON.stringify({ city: 'string', dateFrom: 'string', dateTo: 'string', category: 'string' }) },
    { name: 'createEvent', description: 'Create a new event.', parameters: JSON.stringify({ title: 'string', description: 'string', date: 'string', location: 'string', category: 'string' }) },
    { name: 'getEventsStats', description: 'Get event statistics.', parameters: JSON.stringify({ userId: 'string' }) },
    { name: 'getEventDetails', description: 'Get detailed information about a specific event.', parameters: JSON.stringify({ id: 'string' }) },
    { name: 'updateEvent', description: 'Update an existing event.', parameters: JSON.stringify({ id: 'string', data: 'object' }) },
    { name: 'deleteEvent', description: 'Delete an event.', parameters: JSON.stringify({ id: 'string' }) },
    { name: 'registerSomeone', description: 'Register another user for an event.', parameters: JSON.stringify({ eventId: 'string', email: 'string' }) },
  ];

  const createdSkills = await Promise.all(
    skills.map(skill => 
      prisma.skill.upsert({
        where: { name: skill.name },
        update: {},
        create: skill,
      })
    )
  );
  console.log(`✅ Created ${createdSkills.length} skills`);

  // Create initial Agents
  const agents = [
    {
      name: 'Discovery Scout',
      role: 'Event Search Specialist',
      systemPrompt: 'You are the Discovery Scout. You specialize in finding the perfect events for users.',
      skills: ['searchEvents', 'getEventDetails'],
    },
    {
      name: 'Event Manager',
      role: 'Operations Specialist',
      systemPrompt: 'You are the Event Manager. You handle the "heavy lifting" of creating, modifying, and deleting events.',
      skills: ['createEvent', 'updateEvent', 'deleteEvent', 'registerSomeone'],
    },
    {
      name: 'Data Insight',
      role: 'Analytics Specialist',
      systemPrompt: 'You are Data Insight. You turn raw event data into meaningful statistics.',
      skills: ['getEventsStats'],
    },
  ];

  for (const agent of agents) {
    const agentSkills = createdSkills.filter(s => agent.skills.includes(s.name));
    await prisma.agent.create({
      data: {
        name: agent.name,
        role: agent.role,
        systemPrompt: agent.systemPrompt,
        skills: {
          connect: agentSkills.map(s => ({ id: s.id })),
        },
      },
    });
  }
  console.log(`✅ Created ${agents.length} initial agents`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
