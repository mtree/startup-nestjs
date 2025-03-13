import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { Task } from './entities/task.entity';

@ApiTags('tasks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully', type: Task })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    this.logger.debug(`Creating task for user: ${req.user?.id}`);
    const task = await this.tasksService.create(createTaskDto, req.user);
    this.logger.debug(`Task created successfully: ${task.id}`);
    return task;
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of tasks retrieved successfully', type: [Task] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Request() req) {
    this.logger.debug(`Fetching all tasks for user: ${req.user?.id}`);
    const tasks = await this.tasksService.findAll(req.user);
    this.logger.debug(`Found ${tasks.length} tasks`);
    return tasks;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific task by ID' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully', type: Task })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    this.logger.debug(`Fetching task ${id} for user: ${req.user?.id}`);
    const task = await this.tasksService.findOne(id, req.user);
    this.logger.debug(`Task ${id} found successfully`);
    return task;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully', type: Task })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ) {
    this.logger.debug(`Updating task ${id} for user: ${req.user?.id}`);
    const task = await this.tasksService.update(id, updateTaskDto, req.user);
    this.logger.debug(`Task ${id} updated successfully`);
    return task;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async remove(@Param('id') id: string, @Request() req) {
    this.logger.debug(`Deleting task ${id} for user: ${req.user?.id}`);
    await this.tasksService.remove(id, req.user);
    this.logger.debug(`Task ${id} deleted successfully`);
    return { message: 'Task deleted successfully' };
  }
}
