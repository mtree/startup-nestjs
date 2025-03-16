import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, MatSidenavModule],
  template: `
    <mat-sidenav-container>
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span>{{ title }}</span>
        </mat-toolbar>
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
    mat-sidenav-container {
      height: 100%;
    }
    .content {
      padding: 16px;
    }
  `]
})
export class AppComponent {
  title = 'yeee';
}
