import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

export interface PostProcessedNotification {
  type: 'post-processed';
  postId: string;
  resourceUrl: string;
  status: string;
  message: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private notificationsGateway: NotificationsGateway) {}

  sendPostProcessingNotification(
    userId: string, 
    notification: PostProcessedNotification
  ): void {
    try {
      this.notificationsGateway.sendNotificationToUser(userId, notification);
      this.logger.log(`Sent post processing notification to user ${userId} for post ${notification.postId}`);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }
} 