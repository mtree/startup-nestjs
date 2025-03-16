import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatToolbarModule,
    MatMenuModule
  ],
  template: `
    <div class="dashboard-container">
      <mat-toolbar color="primary" class="dashboard-toolbar">
        <span>Dashboard</span>
        <span class="toolbar-spacer"></span>
        <button mat-icon-button [matMenuTriggerFor]="userMenu" aria-label="User menu">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item>
            <mat-icon>person</mat-icon>
            <span>Profile</span>
          </button>
          <button mat-menu-item>
            <mat-icon>settings</mat-icon>
            <span>Settings</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()">
            <mat-icon>exit_to_app</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </mat-toolbar>

      <div class="dashboard-content">
        <div class="dashboard-grid">
          <mat-card class="dashboard-card">
            <mat-card-header>
              <mat-card-title>Welcome</mat-card-title>
              <mat-card-subtitle>You are successfully logged in</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>This is your personalized dashboard. Here you can manage your account and access various features.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary">
                <mat-icon>explore</mat-icon> Explore
              </button>
            </mat-card-actions>
          </mat-card>
          
          <mat-card class="dashboard-card">
            <mat-card-header>
              <mat-card-title>Quick Actions</mat-card-title>
              <mat-card-subtitle>Frequently used features</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="quick-actions">
                <button mat-raised-button color="accent">
                  <mat-icon>add</mat-icon> New Item
                </button>
                <button mat-raised-button color="primary">
                  <mat-icon>search</mat-icon> Search
                </button>
                <button mat-raised-button color="warn">
                  <mat-icon>report</mat-icon> Reports
                </button>
              </div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="dashboard-card">
            <mat-card-header>
              <mat-card-title>Recent Activity</mat-card-title>
              <mat-card-subtitle>Your latest actions</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="activity-list">
                <div class="activity-item">
                  <mat-icon color="primary">login</mat-icon>
                  <span>You logged in successfully</span>
                </div>
                <mat-divider></mat-divider>
                <div class="activity-item">
                  <mat-icon color="accent">update</mat-icon>
                  <span>Profile updated</span>
                </div>
                <mat-divider></mat-divider>
                <div class="activity-item">
                  <mat-icon color="warn">notifications</mat-icon>
                  <span>New notification received</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="dashboard-card">
            <mat-card-header>
              <mat-card-title>System Status</mat-card-title>
              <mat-card-subtitle>Everything is running smoothly</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="status-item">
                <mat-icon color="primary">check_circle</mat-icon>
                <span>All systems operational</span>
              </div>
              <div class="status-item">
                <mat-icon color="primary">security</mat-icon>
                <span>Security checks passed</span>
              </div>
              <div class="status-item">
                <mat-icon color="primary">update</mat-icon>
                <span>Latest version installed</span>
              </div>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button color="primary">View Details</button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .dashboard-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .toolbar-spacer {
      flex: 1 1 auto;
    }

    .dashboard-content {
      padding: 24px;
      flex: 1;
      overflow-y: auto;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 500px), 1fr));
      gap: 24px;
      width: 100%;
    }

    .dashboard-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 200px;
    }

    mat-card-content {
      flex: 1;
    }

    .quick-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    @media (max-width: 768px) {
      .dashboard-content {
        padding: 16px;
      }
      
      .dashboard-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .quick-actions {
        flex-direction: column;
      }
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