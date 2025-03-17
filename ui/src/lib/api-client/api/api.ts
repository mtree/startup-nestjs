export * from './app.service';
import { AppService } from './app.service';
export * from './auth.service';
import { AuthService } from './auth.service';
export * from './posts.service';
import { PostsService } from './posts.service';
export * from './tasks.service';
import { TasksService } from './tasks.service';
export const APIS = [AppService, AuthService, PostsService, TasksService];
