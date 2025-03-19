import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export enum PostProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

@Entity('posts')
export class Post {
  @ApiProperty({ example: 'uuid-string', description: 'Unique post identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'https://example.com/resource.jpg', description: 'Resource URL' })
  @Column()
  resourceUrl: string;

  @ApiProperty({ example: 'Post Title', description: 'Title extracted from the resource' })
  @Column({ nullable: true })
  title: string;

  @ApiProperty({ example: '{}', description: 'Metadata extracted from the crawled resource' })
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({ example: '2023-03-17T18:00:00.000Z', description: 'Post creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2023-03-17T18:00:00.000Z', description: 'Post last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ 
    example: PostProcessingStatus.PENDING, 
    description: 'Processing status for crawler worker',
    enum: PostProcessingStatus,
    default: PostProcessingStatus.PENDING 
  })
  @Column({
    type: 'enum',
    enum: PostProcessingStatus,
    default: PostProcessingStatus.PENDING
  })
  processingStatus: PostProcessingStatus;

  @ManyToOne(() => User, { eager: true })
  author: User;
} 