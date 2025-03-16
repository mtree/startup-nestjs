import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-nav-item',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatListModule
  ],
  template: `
    <a mat-list-item [routerLink]="route" routerLinkActive="active-link" (click)="onClick()">
      <mat-icon matListItemIcon>{{ icon }}</mat-icon>
      <span matListItemTitle>{{ label }}</span>
    </a>
  `,
  styles: [`
    .active-link {
      background-color: rgba(0, 0, 0, 0.04);
    }
  `]
})
export class NavItemComponent {
  @Input() icon: string = '';
  @Input() label: string = '';
  @Input() route: string = '';
  @Output() itemClicked = new EventEmitter<void>();
  
  onClick(): void {
    this.itemClicked.emit();
  }
} 