import { TestBed } from '@angular/core/testing';
import { HttpEvent, HttpResponse } from '@angular/common/http';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { AuthService as ApiAuthService } from '../../../../lib/api-client/api/auth.service';
import { AuthResponseDto } from '../../../../lib/api-client/model/authResponseDto';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let tokenStorageService: jasmine.SpyObj<TokenStorageService>;
  let apiAuthService: jasmine.SpyObj<ApiAuthService>;

  const mockAuthResponse: AuthResponseDto = {
    access_token: 'test-jwt-token'
  };

  const mockLoginDto = {
    email: 'test@example.com',
    password: 'password123'
  };

  const mockRegisterDto = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  };

  beforeEach(() => {
    const tokenStorageSpy = jasmine.createSpyObj('TokenStorageService', [
      'setToken',
      'clearTokens',
      'isAuthenticated',
      'getToken',
      'getTokenObservable'
    ]);
    
    // Configure getTokenObservable to return an Observable
    tokenStorageSpy.getTokenObservable.and.returnValue(of(null));

    const apiAuthSpy = jasmine.createSpyObj('ApiAuthService', {
      authControllerLogin: of(mockAuthResponse),
      authControllerRegister: of({ message: 'Registration successful' }),
      authControllerGetProfile: of({ id: 1, email: 'test@example.com' })
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: TokenStorageService, useValue: tokenStorageSpy },
        { provide: ApiAuthService, useValue: apiAuthSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    tokenStorageService = TestBed.inject(TokenStorageService) as jasmine.SpyObj<TokenStorageService>;
    apiAuthService = TestBed.inject(ApiAuthService) as jasmine.SpyObj<ApiAuthService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should store token on successful login', (done) => {
      service.login(mockLoginDto).subscribe({
        next: (response) => {
          expect(response).toEqual(mockAuthResponse);
          expect(tokenStorageService.setToken).toHaveBeenCalledWith(mockAuthResponse.access_token);
          expect(apiAuthService.authControllerLogin).toHaveBeenCalledWith(mockLoginDto);
          done();
        }
      });
    });

    it('should not store token on login error', (done) => {
      const error = new Error('Login failed');
      apiAuthService.authControllerLogin.and.returnValue(throwError(() => error));

      service.login(mockLoginDto).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(tokenStorageService.setToken).not.toHaveBeenCalled();
          expect(apiAuthService.authControllerLogin).toHaveBeenCalledWith(mockLoginDto);
          done();
        }
      });
    });
  });

  describe('register', () => {
    it('should call register endpoint', (done) => {
      const mockResponse = { message: 'Registration successful' };

      service.register(mockRegisterDto).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(apiAuthService.authControllerRegister).toHaveBeenCalledWith(mockRegisterDto);
          done();
        }
      });
    });
  });

  describe('getProfile', () => {
    it('should call profile endpoint', (done) => {
      const mockProfile = { id: 1, email: 'test@example.com' };

      service.getProfile().subscribe({
        next: (profile) => {
          expect(profile).toEqual(mockProfile);
          expect(apiAuthService.authControllerGetProfile).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('logout', () => {
    it('should clear tokens on logout', () => {
      service.logout();
      expect(tokenStorageService.clearTokens).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should return authentication status from token service', () => {
      tokenStorageService.isAuthenticated.and.returnValue(true);
      expect(service.isAuthenticated()).toBe(true);

      tokenStorageService.isAuthenticated.and.returnValue(false);
      expect(service.isAuthenticated()).toBe(false);
    });
  });
}); 