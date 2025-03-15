import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    RouterLink
  ],
  template: `
    <div class="flex justify-content-center align-items-center min-h-screen">
      <p-card header="Register" class="w-full md:w-6 lg:w-4">
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="flex flex-column gap-3">
          <div class="flex flex-column gap-2">
            <label for="firstName">First Name</label>
            <input id="firstName" type="text" pInputText formControlName="firstName" />
          </div>

          <div class="flex flex-column gap-2">
            <label for="lastName">Last Name</label>
            <input id="lastName" type="text" pInputText formControlName="lastName" />
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
            <p-button type="submit" label="Register" [disabled]="!registerForm.valid"></p-button>
          </div>

          <div class="text-center">
            <a [routerLink]="['/auth/login']">Already have an account? Login</a>
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
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          console.error('Registration failed:', error);
          // Add error handling here (e.g., show toast message)
        }
      });
    }
  }
} 