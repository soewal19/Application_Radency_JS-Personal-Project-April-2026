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
  const categories = ['conference', 'workshop', 'meetup', 'webinar', 'social', 'sport'];
  const events = [
    { title: 'React Summit 2026', description: 'Annual React conference with top speakers from around the world', location: 'Amsterdam', category: 'conference', maxParticipants: 500 },
    { title: 'TypeScript Workshop', description: 'Hands-on workshop covering advanced TypeScript patterns and practices', location: 'Berlin', category: 'workshop', maxParticipants: 30 },
    { title: 'Node.js Meetup', description: 'Monthly meetup for Node.js developers to share experiences', location: 'London', category: 'meetup', maxParticipants: 50 },
    { title: 'DevOps Webinar', description: 'Deep dive into CI/CD pipelines and infrastructure as code', location: 'Online', category: 'webinar', maxParticipants: 200 },
    { title: 'Tech Social Night', description: 'Networking evening for tech professionals and enthusiasts', location: 'New York', category: 'social', maxParticipants: 100 },
  ];

  for (const event of events) {
    await prisma.event.create({
      data: {
        ...event,
        date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
        organizerId: testUser.id,
        organizerName: testUser.name,
      },
    });
  }
  console.log(`✅ Created ${events.length} sample events`);

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
