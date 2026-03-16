import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  date: Date;

  @Column()
  location: string;

  @Column({ default: 'meetup' })
  category: string;

  @Column({ default: 50 })
  maxParticipants: number;

  @Column({ default: 0 })
  currentParticipants: number;

  @Column('uuid')
  organizerId: string;

  @Column({ default: '' })
  organizerName: string;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
