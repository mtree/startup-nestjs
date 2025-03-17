import { Injectable, OnDestroy } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenStorageService } from '../../features/auth/services/token-storage.service';
import { filter, takeUntil, share } from 'rxjs/operators';

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
  private destroy$ = new Subject<void>();
  private hasSubscribers = false;

  constructor(private tokenStorage: TokenStorageService) {
    // Listen for token changes and reconnect as needed
    this.tokenStorage.getTokenObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(token => {
        if (token && !this.socket && this.hasSubscribers) {
          this.connect();
        } else if (!token && this.socket) {
          this.disconnect();
        }
      });
  }

  /**
   * Initialize socket connection with token authentication
   */
  private connect(): void {
    const token = this.tokenStorage.getToken();
    if (!token) {
      console.log('No authentication token available');
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
    }
    
    // Create socket connection with built-in reconnection
    this.socket = io(`${environment.apiUrl}/notifications`, {
      auth: { token: `Bearer ${token}` },
      withCredentials: true,
      transports: ['websocket'],
      reconnection: true, // Enable built-in reconnection
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Configure socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('auth_success', (data) => {
      console.log('Socket authenticated for user:', data.userId);
      this.connected$.next(true);
    });

    this.socket.on('auth_error', (error) => {
      console.error('Socket authentication error:', error.message);
      this.connected$.next(false);
      // Don't disconnect on auth error - let Socket.IO's reconnection handle it
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      this.connected$.next(false);
      
      // Socket.IO will automatically handle reconnection
      // No need for custom logic
    });

    this.socket.on('notification', (data: PostProcessedNotification) => {
      console.log('Received notification:', data);
      this.notifications$.next(data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.connected$.next(false);
    });
  }

  /**
   * Get notifications stream
   */
  getNotifications(): Observable<PostProcessedNotification> {
    if (!this.hasSubscribers) {
      this.hasSubscribers = true;
      this.connect();
    }
    return this.notifications$.asObservable();
  }

  /**
   * Get connection status stream
   */
  isConnected(): Observable<boolean> {
    if (!this.hasSubscribers) {
      this.hasSubscribers = true;
      this.connect();
    }
    return this.connected$.asObservable();
  }

  /**
   * Manually reconnect socket
   */
  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  /**
   * Disconnect socket
   */
  private disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected$.next(false);
    }
  }
  
  /**
   * Public method to manually disconnect socket
   */
  public disconnectSocket(): void {
    this.hasSubscribers = false;
    this.disconnect();
  }

  /**
   * Cleanup on component destruction
   */
  ngOnDestroy(): void {
    this.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
    this.notifications$.complete();
    this.connected$.complete();
  }
} 