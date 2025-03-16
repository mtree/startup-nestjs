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
import { RegisterDto } from '../../../../../lib/api-client/model/registerDto';

@Component({
  selector: 'app-register',
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
          <mat-card-title i18n="@@registerTitle">Create Account</mat-card-title>
          <mat-card-subtitle i18n="@@registerSubtitle">Join us today and get started</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div *ngIf="errorMessage" class="error-message mat-error">
              {{ errorMessage }}
            </div>

            <mat-form-field appearance="outline">
              <mat-label i18n="@@firstNameLabel">First Name</mat-label>
              <input matInput formControlName="firstName" i18n-placeholder="@@firstNamePlaceholder" placeholder="Enter your first name">
              <mat-icon matPrefix>person</mat-icon>
              <mat-error *ngIf="registerForm.get('firstName')?.errors?.['required']" i18n="@@firstNameRequired">
                First name is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label i18n="@@lastNameLabel">Last Name</mat-label>
              <input matInput formControlName="lastName" i18n-placeholder="@@lastNamePlaceholder" placeholder="Enter your last name">
              <mat-icon matPrefix>person</mat-icon>
              <mat-error *ngIf="registerForm.get('lastName')?.errors?.['required']" i18n="@@lastNameRequired">
                Last name is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label i18n="@@emailLabel">Email</mat-label>
              <input matInput type="email" formControlName="email" i18n-placeholder="@@emailPlaceholder" placeholder="Email address">
              <mat-icon matPrefix>mail</mat-icon>
              <mat-error *ngIf="registerForm.get('email')?.errors?.['required']" i18n="@@emailRequired">
                Email is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('email')?.errors?.['email']" i18n="@@emailInvalid">
                Please enter a valid email address
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label i18n="@@passwordLabel">Password</mat-label>
              <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="password" 
                i18n-placeholder="@@createPasswordPlaceholder" placeholder="Create a password">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix (click)="showPassword = !showPassword" type="button">
                <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('password')?.errors?.['required']" i18n="@@passwordRequired">
                Password is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('password')?.errors?.['minlength']" i18n="@@passwordMinLength">
                Password must be at least 6 characters
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label i18n="@@confirmPasswordLabel">Confirm Password</mat-label>
              <input matInput [type]="showConfirmPassword ? 'text' : 'password'" formControlName="confirmPassword" 
                i18n-placeholder="@@confirmPasswordPlaceholder" placeholder="Confirm your password">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix (click)="showConfirmPassword = !showConfirmPassword" type="button">
                <mat-icon>{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('confirmPassword')?.errors?.['required']" i18n="@@confirmPasswordRequired">
                Password confirmation is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('confirmPassword')?.errors?.['passwordMismatch']" i18n="@@passwordMismatch">
                Passwords do not match
              </mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" [disabled]="!registerForm.valid || isLoading">
              <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
              <span *ngIf="!isLoading" i18n="@@createAccountButton">Create Account</span>
            </button>

            <mat-divider></mat-divider>

            <div class="auth-footer">
              <span i18n="@@haveAccountText">Already have an account?</span>
              <a mat-button color="accent" [routerLink]="['/auth/login']" i18n="@@signInLink">Sign in</a>
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
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const registerData: RegisterDto = {
        firstName: this.registerForm.value.firstName,
        lastName: this.registerForm.value.lastName,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password
      };

      this.authService.register(registerData).subscribe({
        next: () => {
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'An unexpected error occurred';
        }
      });
    }
  }
} 