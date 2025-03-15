import { NgModule } from '@angular/core';
import { ApiModule, Configuration } from '../lib/api-client';
import { environment } from '../environments/environment';

export function apiConfigFactory(): Configuration {
  return new Configuration({
    basePath: environment.apiUrl,
    withCredentials: true
  });
}

@NgModule({
  imports: [
    ApiModule.forRoot(apiConfigFactory)
  ]
})
export class AppModule { }
