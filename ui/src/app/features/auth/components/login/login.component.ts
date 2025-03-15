import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    RouterLink,
    MessageModule
  ],
  template: `
    <div class="flex justify-content-center align-items-center min-h-screen">
      <p-card header="Login" class="w-full md:w-6 lg:w-4">
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-column gap-3">
          <div *ngIf="errorMessage" class="mb-3">
            <p-message severity="error" [text]="errorMessage"></p-message>
          </div>

          <div class="flex flex-column gap-2">
            <label for="email">Email</label>
            <input id="email" type="email" pInputText formControlName="email" />
          </div>
          
          <div class="flex flex-column gap-2">
            <label for="password">Password</label>
            <input id="password" type="password" pInputText formControlName="password" />
          </div>

          <div class="flex flex-column gap-2">
            <p-button type="submit" label="Login" [loading]="isLoading" [disabled]="!loginForm.valid || isLoading"></p-button>
          </div>

          <div class="text-center">
            <a [routerLink]="['/auth/register']">Don't have an account? Register</a>
          </div>
        </form>
      </p-card>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 1rem;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
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
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'An error occurred during login';
          console.error('Login error:', error);
        }
      });
    }
  }
} 