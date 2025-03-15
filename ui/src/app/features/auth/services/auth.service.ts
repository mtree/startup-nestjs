import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthService as ApiAuthService } from '../../../../lib/api-client/api/auth.service';
import { AuthResponseDto } from '../../../../lib/api-client/model/authResponseDto';
import { LoginDto } from '../../../../lib/api-client/model/loginDto';
import { RegisterDto } from '../../../../lib/api-client/model/registerDto';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private apiAuthService: ApiAuthService,
    private tokenStorage: TokenStorageService
  ) {}

  login(credentials: LoginDto): Observable<AuthResponseDto> {
    return this.apiAuthService.authControllerLogin(credentials).pipe(
      tap((response: AuthResponseDto) => {
        this.tokenStorage.setToken(response.access_token);
      })
    );
  }

  register(userData: RegisterDto): Observable<any> {
    return this.apiAuthService.authControllerRegister(userData);
  }

  getProfile(): Observable<any> {
    return this.apiAuthService.authControllerGetProfile();
  }

  logout(): void {
    this.tokenStorage.clearTokens();
  }

  isAuthenticated(): boolean {
    return this.tokenStorage.isAuthenticated();
  }
} 