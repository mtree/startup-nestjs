import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title i18n="@@loginWelcomeTitle">Welcome Back!</mat-card-title>
          <mat-card-subtitle i18n="@@loginWelcomeSubtitle">Sign in to continue to your account</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div *ngIf="errorMessage" class="error-message mat-error">
              {{ errorMessage }}
            </div>

            <mat-form-field appearance="outline">
              <mat-label i18n="@@emailLabel">Email</mat-label>
              <input matInput type="email" formControlName="email" i18n-placeholder="@@emailPlaceholder" placeholder="Email address">
              <mat-icon matPrefix>mail</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.errors?.['required']" i18n="@@emailRequired">
                Email is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.errors?.['email']" i18n="@@emailInvalid">
                Please enter a valid email address
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label i18n="@@passwordLabel">Password</mat-label>
              <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="password" 
                i18n-placeholder="@@passwordPlaceholder" placeholder="Enter your password">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix (click)="showPassword = !showPassword" type="button">
                <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.errors?.['required']" i18n="@@passwordRequired">
                Password is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('password')?.errors?.['minlength']" i18n="@@passwordMinLength">
                Password must be at least 6 characters
              </mat-error>
            </mat-form-field>

            <div class="forgot-password">
              <a mat-button color="primary" i18n="@@forgotPassword">Forgot password?</a>
            </div>

            <button mat-raised-button color="primary" type="submit" [disabled]="!loginForm.valid || isLoading">
              <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
              <span *ngIf="!isLoading" i18n="@@signInButton">Sign In</span>
            </button>

            <mat-divider></mat-divider>

            <div class="auth-footer">
              <span i18n="@@noAccountText">Don't have an account?</span>
              <a mat-button color="accent" [routerLink]="['/auth/register']" i18n="@@createAccountLink">Create one now</a>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
    }
    mat-card {
      max-width: 400px;
      width: 100%;
    }
    mat-card-header {
      margin-bottom: 16px;
      text-align: center;
    }
    mat-card-content form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .error-message {
      padding: 16px;
      border-radius: 4px;
    }
    .forgot-password {
      text-align: right;
    }
    .auth-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
    }
    mat-divider {
      margin: 24px 0;
    }
    button[type="submit"] {
      height: 48px;
    }
    button[type="submit"] mat-spinner {
      margin: 0 auto;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'An unexpected error occurred';
        }
      });
    }
  }
} 