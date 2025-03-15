import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly TOKEN_KEY = 'auth_token';
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());
  
  constructor() {}

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getTokenObservable(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  setToken(token: string | null): void {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
    this.tokenSubject.next(token);
  }

  clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.tokenSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
} 