import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main>
      <h1>Hello, {{title}}</h1>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    main {
      width: 100%;
      height: 100%;
    }
    h1 {
      margin: 1rem;
      font-size: 1.5rem;
    }
  `]
})
export class AppComponent {
  title = 'yeee';
}
