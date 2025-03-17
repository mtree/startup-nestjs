import { Injectable, OnDestroy } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../../features/auth/services/token-storage.service';

export interface PostProcessedNotification {
  type: 'post-processed';
  postId: string;
  resourceUrl: string;
  status: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private notifications$ = new Subject<PostProcessedNotification>();
  private connected$ = new BehaviorSubject<boolean>(false);

  constructor(private tokenStorage: TokenStorageService) {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    if (this.socket) {
      this.socket.close();
    }

    const token = this.tokenStorage.getToken();
    if (!token) {
      return;
    }

    this.socket = io(`${environment.apiUrl}/notifications`, {
      auth: {
        token: `Bearer ${token}`
      },
      withCredentials: true,
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connected$.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected$.next(false);
    });

    this.socket.on('notification', (data: PostProcessedNotification) => {
      console.log('Received notification:', data);
      this.notifications$.next(data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connected$.next(false);
    });
  }

  getNotifications(): Observable<PostProcessedNotification> {
    return this.notifications$.asObservable();
  }

  isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  reconnect(): void {
    this.initializeConnection();
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.notifications$.complete();
    this.connected$.complete();
  }
} 