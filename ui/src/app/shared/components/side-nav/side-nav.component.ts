import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { NavItemComponent } from '../nav-item/nav-item.component';

export interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    NavItemComponent
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer 
                  class="sidenav" 
                  [mode]="isHandset ? 'over' : 'side'"
                  [opened]="!isHandset"
                  [attr.role]="isHandset ? 'dialog' : 'navigation'">
        <mat-toolbar>{{ appName }}</mat-toolbar>
        <mat-nav-list class="nav-list">
          <app-nav-item *ngFor="let item of navItems" 
                      [icon]="item.icon" 
                      [label]="item.label" 
                      [route]="item.route"
                      (itemClicked)="onNavItemClicked()">
          </app-nav-item>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content class="sidenav-content">
        <ng-content></ng-content>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }
    
    .sidenav-container {
      height: 100%;
      width: 100%;
    }
    
    .sidenav {
      width: 250px;
      display: flex;
      flex-direction: column;
    }
    
    .sidenav .mat-toolbar {
      background: inherit;
      flex-shrink: 0;
    }

    .nav-list {
      flex: 1;
      overflow-y: auto;
    }

    .sidenav-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
  `]
})
export class SideNavComponent {
  @ViewChild('drawer') drawer!: MatSidenav;
  @Input() isHandset: boolean = false;
  @Input() appName: string = 'Application';
  @Input() navItems: NavItem[] = [];
  
  onNavItemClicked(): void {
    // Only close the drawer if it's in 'over' mode (mobile view)
    if (this.isHandset) {
      this.drawer.close();
    }
  }
} 