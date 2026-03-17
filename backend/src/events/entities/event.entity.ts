/** Event entity — Prisma-managed. TypeORM decorators removed (not used). */
export class Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  category: string;
  maxParticipants: number;
  currentParticipants: number;
  organizerId: string;
  organizerName: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
