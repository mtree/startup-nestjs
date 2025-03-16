import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>User Profile</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>This is the profile page. Content will be added later.</p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card {
      max-width: 800px;
      margin: 0 auto;
    }
  `]
})
export class ProfileComponent {} 