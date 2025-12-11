import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalType = 'confirm' | 'info' | 'success' | 'error' | 'detail';

export interface ModalConfig {
  title: string;
  message?: string;
  type: ModalType;
  data?: any;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrls: ['./modal.css']
})
export class Modal {
  @Input() isOpen = false;
  @Input() config: ModalConfig = {
    title: '',
    type: 'info',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    showCancel: true
  };

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  confirm(): void {
    this.onConfirm.emit();
  }

  cancel(): void {
    this.onCancel.emit();
  }

  close(): void {
    this.onClose.emit();
  }

  getIconClass(): string {
    switch (this.config.type) {
      case 'confirm': return '❓';
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      case 'detail': return '📋';
      default: return 'ℹ️';
    }
  }

  getModalClass(): string {
    return `modal-content modal-${this.config.type}`;
  }
}