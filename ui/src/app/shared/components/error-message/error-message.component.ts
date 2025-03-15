import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message" class="error-container" [class.show]="show">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ message }}</span>
        <button class="close-button" (click)="show = false">×</button>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 16px;
      max-width: 400px;
      z-index: 1000;
      transform: translateX(120%);
      transition: transform 0.3s ease-in-out;
      border-left: 4px solid #dc3545;
    }

    .error-container.show {
      transform: translateX(0);
    }

    .error-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .error-icon {
      font-size: 20px;
    }

    .error-text {
      flex: 1;
      color: #333;
      font-size: 14px;
    }

    .close-button {
      background: none;
      border: none;
      color: #666;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .close-button:hover {
      color: #333;
    }
  `]
})
export class ErrorMessageComponent {
  @Input() message = '';
  show = true;
}
