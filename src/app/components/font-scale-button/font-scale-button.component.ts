import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { FontScaleService } from '../../services/font-scale.service';

/**
 * Botón reutilizable para ciclar entre los tamaños de letra disponibles.
 * Aplica la escala globalmente vía CSS var --font-scale y la persiste en
 * localStorage.
 *
 * Uso en cualquier ion-toolbar:
 *   <app-font-scale-button></app-font-scale-button>
 *
 * Si la página necesita reaccionar al cambio (p.ej. para binding local):
 *   <app-font-scale-button (scaleChange)="fontScale = $event"></app-font-scale-button>
 */
@Component({
  selector: 'app-font-scale-button',
  templateUrl: './font-scale-button.component.html',
  styleUrls: ['./font-scale-button.component.scss'],
  standalone: false,
})
export class FontScaleButtonComponent implements OnInit, OnDestroy {

  /** Emite la nueva escala numérica cada vez que el usuario pulsa el botón */
  @Output() scaleChange = new EventEmitter<number>();

  /** Etiqueta accesible que muestra el nivel actual al usuario */
  label = 'Tamaño de letra: normal';

  private sub?: Subscription;
  private readonly LABELS = ['normal', 'mediano', 'grande'];

  constructor(private fontScaleService: FontScaleService) {}

  ngOnInit(): void {
    this.sub = this.fontScaleService.scale$.subscribe(scale => {
      const idx = [1, 1.2, 1.4].indexOf(scale);
      this.label = `Tamaño de letra: ${this.LABELS[idx] ?? 'normal'}`;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onClick(): void {
    this.fontScaleService.increase();
    this.scaleChange.emit(this.fontScaleService.scale);
  }
}
