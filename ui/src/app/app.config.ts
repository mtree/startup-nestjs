import { ApplicationConfig, importProvidersFrom } from '@angular/core';

// PrimeNG
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

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
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    }),
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
    importProvidersFrom(
      ApiModule.forRoot(apiConfigFactory)
    )
  ]
};
