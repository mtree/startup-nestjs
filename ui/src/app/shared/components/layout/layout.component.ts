import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, Event, ActivatedRoute } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, of } from 'rxjs';
import { map, shareReplay, filter, switchMap } from 'rxjs/operators';
import { SideNavComponent, NavItem } from '../side-nav/side-nav.component';
import { AuthService } from '../../../features/auth/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatDividerModule,
    SideNavComponent
  ],
  template: `
    <app-side-nav #sideNav
                 [isHandset]="(isHandset$ | async) === true" 
                 [appName]="appName" 
                 [navItems]="navItems">
      <mat-toolbar color="primary" class="toolbar">
        <button
          mat-icon-button
          i18n-aria-label="@@toggleSidenav"
          aria-label="Toggle sidenav"
          (click)="sideNav.drawer.toggle()"
          *ngIf="isHandset$ | async">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="toolbar-title">{{ pageTitle }}</span>
        <span class="toolbar-spacer"></span>
        <button mat-icon-button [matMenuTriggerFor]="userMenu" i18n-aria-label="@@userMenu" aria-label="User menu">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon>
            <span i18n="@@profile">Profile</span>
          </button>
          <button mat-menu-item routerLink="/settings">
            <mat-icon>settings</mat-icon>
            <span i18n="@@settings">Settings</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="logout()">
            <mat-icon>exit_to_app</mat-icon>
            <span i18n="@@logout">Logout</span>
          </button>
        </mat-menu>
      </mat-toolbar>
      
      <div class="content-container">
        <router-outlet></router-outlet>
      </div>
    </app-side-nav>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      flex-shrink: 0;
    }

    .toolbar-spacer {
      flex: 1 1 auto;
    }
    
    .toolbar-title {
      margin-left: 8px;
    }
    
    .content-container {
      flex: 1;
      overflow: auto;
    }
  `]
})
export class LayoutComponent implements OnInit {
  @ViewChild('sideNav') sideNav!: SideNavComponent;
  
  isHandset$: Observable<boolean>;
  appName = $localize`:@@appName:My Application`;
  pageTitle = $localize`:@@dashboard:Dashboard`;
  
  navItems: NavItem[] = [
    { icon: 'dashboard', label: $localize`:@@dashboard:Dashboard`, route: '/dashboard' },
    { icon: 'person', label: $localize`:@@profile:Profile`, route: '/profile' },
    { icon: 'settings', label: $localize`:@@settings:Settings`, route: '/settings' },
    { icon: 'help', label: $localize`:@@help:Help`, route: '/help' }
  ];
  
  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
      
    // Update page title based on current route
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd),
      switchMap(() => {
        // Get the current route data
        const currentUrl = this.router.url;
        const routeData = this.activatedRoute.firstChild?.snapshot.data || {};
        return of({ url: currentUrl, data: routeData });
      })
    ).subscribe(({ url, data }) => {
      this.updatePageTitle(url, data);
    });
  }
  
  ngOnInit(): void {
    // Set initial page title based on current route
    const routeData = this.activatedRoute.firstChild?.snapshot.data || {};
    this.updatePageTitle(this.router.url, routeData);
  }
  
  private updatePageTitle(url: string, routeData: any): void {
    // First check if there's a custom title in the route data
    if (routeData && routeData['title']) {
      this.pageTitle = routeData['title'];
      return;
    }
    
    // If there's an entityTitle in the route data, use that
    if (routeData && routeData['entityTitle']) {
      this.pageTitle = routeData['entityTitle'];
      return;
    }
    
    // Fall back to navItems if no custom title is provided
    const currentNavItem = this.navItems.find(item => url.startsWith(item.route));
    if (currentNavItem) {
      this.pageTitle = currentNavItem.label;
    }
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
} 