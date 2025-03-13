import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ example: 'Complete Project', description: 'Task title' })
  title: string;

  @ApiProperty({ example: 'Finish the NestJS project implementation', description: 'Task description' })
  description: string;
}

export class UpdateTaskDto {
  @ApiProperty({ example: 'Complete Project', description: 'Task title', required: false })
  title?: string;

  @ApiProperty({ example: 'Finish the NestJS project implementation', description: 'Task description', required: false })
  description?: string;

  @ApiProperty({ example: true, description: 'Task completion status', required: false })
  completed?: boolean;
}
