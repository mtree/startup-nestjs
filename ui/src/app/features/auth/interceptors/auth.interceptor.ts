import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TokenStorageService } from '../services/token-storage.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private tokenStorage: TokenStorageService,
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip authentication for non-API requests and auth endpoints
    if (!request.url.startsWith(environment.apiUrl) || this.isAuthEndpoint(request)) {
      return next.handle(request);
    }

    const token = this.tokenStorage.getToken();
    if (token) {
      request = this.addTokenHeader(request, token);
    }

    return next.handle(request).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          // Clear tokens and force re-login
          this.tokenStorage.clearTokens();
        }
        return throwError(() => error);
      })
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  private isAuthEndpoint(request: HttpRequest<any>): boolean {
    const authEndpoints = ['/auth/login', '/auth/register'];
    return authEndpoints.some(endpoint => request.url.includes(endpoint));
  }
} 