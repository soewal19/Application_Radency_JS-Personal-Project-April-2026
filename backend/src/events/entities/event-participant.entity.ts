import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('event_participants')
export class EventParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  eventId: string;

  @Column('uuid')
  userId: string;

  @CreateDateColumn()
  joinedAt: Date;
}
