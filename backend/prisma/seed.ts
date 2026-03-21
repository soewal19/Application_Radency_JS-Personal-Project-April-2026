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
  const hashedPassword = await bcrypt.hash('Test123!', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@eventhub.com' },
    update: {},
    create: {
      email: 'test@eventhub.com',
      name: 'Test User',
      password: hashedPassword,
    },
  });
  console.log(`✅ Test user: ${testUser.email} / Test123!`);

  // Create sample events
  const categories = ['conference', 'workshop', 'meetup', 'webinar', 'social', 'sport', 'music', 'art', 'food', 'tech'];
  const locations = ['Amsterdam', 'Berlin', 'London', 'New York', 'Tokyo', 'Paris', 'Sydney', 'Toronto', 'San Francisco', 'Online', 'Dubai', 'Singapore', 'Barcelona', 'Rome', 'Vienna'];
  
  // First create tags
  const tagNames = ['tech', 'music', 'art', 'sport', 'food', 'business', 'charity', 'health', 'education', 'social'];
  const createdTags = await Promise.all(
    tagNames.map(async (name) => {
      return prisma.tag.upsert({
        where: { normalized: name },
        update: {},
        create: { name, normalized: name },
      });
    })
  );
  console.log(`✅ Created/updated ${createdTags.length} tags`);

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
