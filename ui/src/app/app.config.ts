import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { ApiInterceptor } from './core/interceptors/api.interceptor';
import { ApiModule, Configuration } from '../lib/api-client';
import { environment } from '../environments/environment';
import { provideNativeDateAdapter } from '@angular/material/core';

// API client configuration
export function apiConfigFactory(): Configuration {
  return new Configuration({
    basePath: environment.apiUrl,
    withCredentials: true
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
    provideHttpClient(
      withInterceptorsFromDi()
    ),
    provideNativeDateAdapter(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiInterceptor,
      multi: true
    },
    {
      provide: Configuration,
      useFactory: apiConfigFactory
    },
    {
      provide: LOCALE_ID,
      useValue: 'pl'
    },
    importProvidersFrom(
      ApiModule.forRoot(apiConfigFactory)
    ),
    provideClientHydration()
  ]
};
