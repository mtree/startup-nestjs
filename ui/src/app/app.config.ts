import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { routes } from './app.routes';
import { ApiInterceptor } from './core/interceptors/api.interceptor';
import { ApiModule, Configuration } from '../lib/api-client';
import { environment } from '../environments/environment';

// API client configuration
export function apiConfigFactory(): Configuration {
  return new Configuration({
    basePath: environment.apiUrl,
    withCredentials: true
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptorsFromDi()
    ),
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
