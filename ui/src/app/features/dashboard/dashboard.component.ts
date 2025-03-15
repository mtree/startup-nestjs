import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-card">
        <div class="card-header">
          <h2>Welcome to Your Dashboard</h2>
        </div>
        <div class="card-content">
          <p>You are successfully logged in.</p>
          <div class="action-buttons">
            <button class="btn-primary" (click)="logout()">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      min-height: 100vh;
      background-color: #f8f9fa;
    }

    .dashboard-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .card-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .card-header h2 {
      font-size: 1.5rem;
      color: #1e293b;
      margin: 0;
      font-weight: 500;
    }

    .card-content {
      padding: 1.5rem;
    }

    .card-content p {
      color: #64748b;
      margin: 0 0 1.5rem;
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
    }

    .btn-primary {
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-primary:hover {
      background-color: #2563eb;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
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