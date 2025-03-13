import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty({ example: 'uuid-string', description: 'Unique user identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: 'John', description: 'User first name' })
  @Column()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @Column()
  lastName: string;

  @Exclude()
  @Column()
  password: string;

  @ApiProperty({ example: '2025-03-13T18:00:00.000Z', description: 'Account creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2025-03-13T18:00:00.000Z', description: 'Account last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ example: true, description: 'Whether the user account is active' })
  @Column({ default: true })
  isActive: boolean;
}
