import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: { title: string; description: string }, user: User): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      user,
    });
    return this.taskRepository.save(task);
  }

  async findAll(user: User): Promise<Task[]> {
    return this.taskRepository.find({
      where: { user: { id: user.id } },
    });
  }

  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, user: { id: user.id } },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(id: string, updateTaskDto: { title?: string; description?: string; completed?: boolean }, user: User): Promise<Task> {
    const task = await this.findOne(id, user);
    Object.assign(task, updateTaskDto);
    return this.taskRepository.save(task);
  }

  async remove(id: string, user: User): Promise<boolean> {
    const task = await this.findOne(id, user);
    const result = await this.taskRepository.delete(id);
    return result.affected > 0;
  }
}
