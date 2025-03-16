import { Injectable } from '@angular/core';
import { Observable, tap, map } from 'rxjs';
import { AuthService as ApiAuthService } from '../../../../lib/api-client/api/auth.service';
import { AuthResponseDto } from '../../../../lib/api-client/model/authResponseDto';
import { LoginDto } from '../../../../lib/api-client/model/loginDto';
import { RegisterDto } from '../../../../lib/api-client/model/registerDto';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * Observable that emits the current authentication state
   */
  isAuthenticated$: Observable<boolean>;

  constructor(
    private apiAuthService: ApiAuthService,
    private tokenStorage: TokenStorageService
  ) {
    // Create an observable from the token observable
    this.isAuthenticated$ = this.tokenStorage.getTokenObservable().pipe(
      map(token => !!token)
    );
  }

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