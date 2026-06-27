import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const STORAGE_KEY = 'fontScaleIdx';
const FONT_SCALES: number[] = [1, 1.2, 1.4];
const CSS_VAR     = '--font-scale';

@Injectable({ providedIn: 'root' })
export class FontScaleService {

  private _idx   = 0;
  private _scale = FONT_SCALES[0];

  /** Observable con la escala actual (1 | 1.2 | 1.4) */
  readonly scale$ = new BehaviorSubject<number>(this._scale);

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (idx >= 0 && idx < FONT_SCALES.length) {
        this._idx   = idx;
        this._scale = FONT_SCALES[idx];
      }
    }
    this._apply();
  }

  get scale(): number { return this._scale; }

  /** Avanza al siguiente nivel y persiste */
  increase(): void {
    this._idx   = (this._idx + 1) % FONT_SCALES.length;
    this._scale = FONT_SCALES[this._idx];
    localStorage.setItem(STORAGE_KEY, String(this._idx));
    this._apply();
    this.scale$.next(this._scale);
  }

  private _apply(): void {
    document.documentElement.style.setProperty(CSS_VAR, String(this._scale));
  }
}
