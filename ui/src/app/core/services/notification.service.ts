import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SocketService, PostProcessedNotification } from './socket.service';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(
    private socketService: SocketService,
    private snackBar: MatSnackBar
  ) {
    this.initializeNotificationListener();
  }

  private initializeNotificationListener(): void {
    this.socketService.getNotifications()
      .pipe(
        filter(notification => notification.type === 'post-processed')
      )
      .subscribe(notification => {
        this.showPostProcessingNotification(notification);
      });
  }

  private showPostProcessingNotification(notification: PostProcessedNotification): void {
    const isSuccess = notification.status === 'completed';
    const message = notification.message;
    const action = 'Close';
    
    this.snackBar.open(message, action, {
      duration: 8000,
      panelClass: isSuccess ? ['success-notification'] : ['error-notification'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-notification'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-notification'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
} 