import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './core/services/notification.service';
import { AuthService } from './features/auth/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
      overflow: hidden; /* Prevent scrolling at root level */
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Angular App';

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // We only need to inject the notification service to initialize it
    // The service itself handles listening to notifications

    // We don't need to do anything else here, as the service will
    // automatically listen for notifications when it's initialized
  }
}
