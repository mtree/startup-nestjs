import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule],
  template: `
    <div class="p-4">
      <p-card>
        <h2>Welcome to Your Dashboard</h2>
        <div class="mt-4">
          <p-button label="Logout" (click)="logout()"></p-button>
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DashboardComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Add initialization logic here
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
} 