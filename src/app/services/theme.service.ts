import { Injectable } from '@angular/core';

const DARK_MODE_KEY = 'darkMode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkMode = false;

  constructor() {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved !== null) {
      this.darkMode = saved === 'true';
    } else {
      this.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.aplicar();
  }

  esModoOscuro(): boolean {
    return this.darkMode;
  }

  alternar(): void {
    this.darkMode = !this.darkMode;
    localStorage.setItem(DARK_MODE_KEY, String(this.darkMode));
    this.aplicar();
  }

  private aplicar(): void {
    document.documentElement.classList.toggle('ion-palette-dark', this.darkMode);
  }
}
