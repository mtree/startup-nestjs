import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('tasks')
export class Task {
  @ApiProperty({ example: 'uuid-string', description: 'Unique task identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Complete Project', description: 'Task title' })
  @Column()
  title: string;

  @ApiProperty({ example: 'Finish the NestJS project implementation', description: 'Task description' })
  @Column()
  description: string;

  @ApiProperty({ example: false, description: 'Task completion status' })
  @Column({ default: false })
  completed: boolean;

  @ApiProperty({ example: '2025-03-13T18:00:00.000Z', description: 'Task creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2025-03-13T18:00:00.000Z', description: 'Task last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { eager: false })
  user: User;
}
