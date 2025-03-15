import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { TokenStorageService } from '../services/token-storage.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../../environments/environment';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let tokenStorageService: jasmine.SpyObj<TokenStorageService>;
  let authService: jasmine.SpyObj<AuthService>;

  const mockToken = 'test-jwt-token';
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    const tokenStorageSpy = jasmine.createSpyObj('TokenStorageService', ['getToken', 'clearTokens']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        },
        { provide: TokenStorageService, useValue: tokenStorageSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    tokenStorageService = TestBed.inject(TokenStorageService) as jasmine.SpyObj<TokenStorageService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should add auth header to API requests when token exists', () => {
    tokenStorageService.getToken.and.returnValue(mockToken);

    httpClient.get(`${apiUrl}/test`).subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/test`);
    expect(httpRequest.request.headers.has('Authorization')).toBeTruthy();
    expect(httpRequest.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
  });

  it('should not add auth header to non-API requests', () => {
    tokenStorageService.getToken.and.returnValue(mockToken);

    httpClient.get('/assets/image.png').subscribe();

    const httpRequest = httpTestingController.expectOne('/assets/image.png');
    expect(httpRequest.request.headers.has('Authorization')).toBeFalsy();
  });

  it('should not add auth header to auth endpoints', () => {
    tokenStorageService.getToken.and.returnValue(mockToken);

    httpClient.post(`${apiUrl}/auth/login`, {}).subscribe();

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/auth/login`);
    expect(httpRequest.request.headers.has('Authorization')).toBeFalsy();
  });

  it('should clear tokens on 401 error', () => {
    tokenStorageService.getToken.and.returnValue(mockToken);

    httpClient.get(`${apiUrl}/test`).subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(401);
        expect(tokenStorageService.clearTokens).toHaveBeenCalled();
      }
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/test`);
    httpRequest.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('should not clear tokens on non-401 errors', () => {
    tokenStorageService.getToken.and.returnValue(mockToken);

    httpClient.get(`${apiUrl}/test`).subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(500);
        expect(tokenStorageService.clearTokens).not.toHaveBeenCalled();
      }
    });

    const httpRequest = httpTestingController.expectOne(`${apiUrl}/test`);
    httpRequest.flush('Server Error', { status: 500, statusText: 'Server Error' });
  });
}); 