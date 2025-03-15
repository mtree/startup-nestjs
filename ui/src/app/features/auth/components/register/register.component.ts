import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterDto } from '../../../../../lib/api-client/model/registerDto';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink
  ],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1 i18n="@@registerTitle">Create Account</h1>
          <p i18n="@@registerSubtitle">Join us today and get started</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div *ngIf="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <div class="form-group">
            <label for="firstName" i18n="@@firstNameLabel">First Name</label>
            <div class="input-container">
              <span class="material-icons">person</span>
              <input 
                id="firstName" 
                type="text" 
                formControlName="firstName" 
                i18n-placeholder="@@firstNamePlaceholder"
                placeholder="Enter your first name"
                [class.invalid]="registerForm.get('firstName')?.touched && registerForm.get('firstName')?.invalid"
              />
            </div>
            <div 
              class="error-text" 
              *ngIf="registerForm.get('firstName')?.touched && registerForm.get('firstName')?.invalid"
            >
              <span *ngIf="registerForm.get('firstName')?.errors?.['required']" i18n="@@firstNameRequired">First name is required</span>
            </div>
          </div>

          <div class="form-group">
            <label for="lastName" i18n="@@lastNameLabel">Last Name</label>
            <div class="input-container">
              <span class="material-icons">person</span>
              <input 
                id="lastName" 
                type="text" 
                formControlName="lastName" 
                i18n-placeholder="@@lastNamePlaceholder"
                placeholder="Enter your last name"
                [class.invalid]="registerForm.get('lastName')?.touched && registerForm.get('lastName')?.invalid"
              />
            </div>
            <div 
              class="error-text" 
              *ngIf="registerForm.get('lastName')?.touched && registerForm.get('lastName')?.invalid"
            >
              <span *ngIf="registerForm.get('lastName')?.errors?.['required']" i18n="@@lastNameRequired">Last name is required</span>
            </div>
          </div>

          <div class="form-group">
            <label for="email" i18n="@@emailLabel">Email</label>
            <div class="input-container">
              <span class="material-icons">mail</span>
              <input 
                id="email" 
                type="email" 
                formControlName="email" 
                i18n-placeholder="@@emailPlaceholder"
                placeholder="Email address"
                [class.invalid]="registerForm.get('email')?.touched && registerForm.get('email')?.invalid"
              />
            </div>
            <div 
              class="error-text" 
              *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.invalid"
            >
              <span *ngIf="registerForm.get('email')?.errors?.['required']" i18n="@@emailRequired">Email is required</span>
              <span *ngIf="registerForm.get('email')?.errors?.['email']" i18n="@@emailInvalid">Please enter a valid email address</span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="password" i18n="@@passwordLabel">Password</label>
            <div class="input-container">
              <span class="material-icons">lock</span>
              <input 
                id="password" 
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password" 
                i18n-placeholder="@@createPasswordPlaceholder"
                placeholder="Create a password"
                [class.invalid]="registerForm.get('password')?.touched && registerForm.get('password')?.invalid"
              />
              <span 
                class="material-icons password-toggle" 
                (click)="showPassword = !showPassword"
              >
                {{ showPassword ? 'visibility_off' : 'visibility' }}
              </span>
            </div>
            <div 
              class="error-text" 
              *ngIf="registerForm.get('password')?.touched && registerForm.get('password')?.invalid"
            >
              <span *ngIf="registerForm.get('password')?.errors?.['required']" i18n="@@passwordRequired">Password is required</span>
              <span *ngIf="registerForm.get('password')?.errors?.['minlength']" i18n="@@passwordMinLength">Password must be at least 6 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword" i18n="@@confirmPasswordLabel">Confirm Password</label>
            <div class="input-container">
              <span class="material-icons">lock</span>
              <input 
                id="confirmPassword" 
                [type]="showConfirmPassword ? 'text' : 'password'"
                formControlName="confirmPassword" 
                i18n-placeholder="@@confirmPasswordPlaceholder"
                placeholder="Confirm your password"
                [class.invalid]="registerForm.get('confirmPassword')?.touched && registerForm.get('confirmPassword')?.invalid"
              />
              <span 
                class="material-icons password-toggle" 
                (click)="showConfirmPassword = !showConfirmPassword"
              >
                {{ showConfirmPassword ? 'visibility_off' : 'visibility' }}
              </span>
            </div>
            <div 
              class="error-text" 
              *ngIf="registerForm.get('confirmPassword')?.touched && registerForm.get('confirmPassword')?.invalid"
            >
              <span *ngIf="registerForm.get('confirmPassword')?.errors?.['required']" i18n="@@confirmPasswordRequired">Password confirmation is required</span>
              <span *ngIf="registerForm.get('confirmPassword')?.errors?.['passwordMismatch']" i18n="@@passwordMismatch">Passwords do not match</span>
            </div>
          </div>

          <button 
            type="submit" 
            class="submit-button"
            [disabled]="!registerForm.valid || isLoading"
          >
            <span *ngIf="!isLoading" i18n="@@createAccountButton">Create Account</span>
            <span *ngIf="isLoading" class="loader"></span>
          </button>

          <div class="divider">
            <span i18n="@@orDivider">OR</span>
          </div>

          <div class="auth-footer">
            <span i18n="@@haveAccountText">Already have an account?</span>
            <a [routerLink]="['/auth/login']" i18n="@@signInLink">Sign in</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f8f9fa;
      padding: 1rem;
    }

    .auth-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 600px;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-header h1 {
      font-size: 2rem;
      color: #1e293b;
      margin: 0 0 0.5rem;
      font-weight: 500;
    }

    .auth-header p {
      color: #64748b;
      margin: 0;
      line-height: 1.5;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 500;
      color: #1e293b;
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-container .material-icons {
      position: absolute;
      left: 1rem;
      color: #64748b;
    }

    .input-container input {
      width: 100%;
      padding: 0.875rem 1rem 0.875rem 3rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .input-container input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .input-container input.invalid {
      border-color: #ef4444;
    }

    .password-toggle {
      position: absolute;
      right: 1rem;
      cursor: pointer;
      color: #64748b;
    }

    .error-message {
      background-color: #fef2f2;
      color: #ef4444;
      padding: 1rem;
      border-radius: 6px;
      text-align: center;
    }

    .error-text {
      color: #ef4444;
      font-size: 0.875rem;
    }

    .submit-button {
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 1rem;
      font-size: 1.125rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
      min-height: 3.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .submit-button:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .submit-button:disabled {
      background-color: #94a3b8;
      cursor: not-allowed;
    }

    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 1.5rem 0;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid #e2e8f0;
    }

    .divider span {
      padding: 0 1rem;
      color: #64748b;
      font-weight: 500;
    }

    .auth-footer {
      text-align: center;
      color: #64748b;
    }

    .auth-footer a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
      margin-left: 0.5rem;
    }

    .auth-footer a:hover {
      text-decoration: underline;
    }

    .loader {
      width: 20px;
      height: 20px;
      border: 2px solid #ffffff;
      border-bottom-color: transparent;
      border-radius: 50%;
      display: inline-block;
      animation: rotation 1s linear infinite;
    }

    @keyframes rotation {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
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

      const { confirmPassword, ...registerData } = this.registerForm.value;
      this.authService.register(registerData).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'An error occurred during registration';
          console.error('Registration error:', error);
        }
      });
    } else {
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }
} 