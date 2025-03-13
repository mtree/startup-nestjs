import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { NotFoundException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let mockTaskRepository: any;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    completed: false,
    user: mockUser,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCreateTaskDto: CreateTaskDto = {
    title: 'Test Task',
    description: 'Test Description'
  };

  const mockUpdateTaskDto: UpdateTaskDto = {
    title: 'Updated Task',
    description: 'Updated Description',
    completed: true
  };

  beforeEach(async () => {
    mockTaskRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(mockCreateTaskDto, mockUser);

      expect(result).toEqual(mockTask);
      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        ...mockCreateTaskDto,
        user: mockUser,
      });
      expect(mockTaskRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      mockTaskRepository.find.mockResolvedValue([mockTask]);

      const result = await service.findAll(mockUser);

      expect(result).toEqual([mockTask]);
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id } },
      });
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('1', mockUser);

      expect(result).toEqual(mockTask);
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', user: { id: mockUser.id } },
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updatedTask = { ...mockTask, ...mockUpdateTaskDto };
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(updatedTask);

      const result = await service.update('1', mockUpdateTaskDto, mockUser);

      expect(result).toEqual(updatedTask);
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', user: { id: mockUser.id } },
      });
      expect(mockTaskRepository.save).toHaveBeenCalledWith(updatedTask);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', mockUpdateTaskDto, mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('1', mockUser);

      expect(result).toBeTruthy();
      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', user: { id: mockUser.id } },
      });
      expect(mockTaskRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999', mockUser)).rejects.toThrow(NotFoundException);
    });
  });
});
