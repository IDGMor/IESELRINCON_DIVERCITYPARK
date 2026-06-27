import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { App } from '@capacitor/app';
import { AlertController } from '@ionic/angular';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

const RUTAS_SIN_TABS = ['/login', '/registro', '/detalle-plaza', '/incidencias'];

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {

  mostrarTabs = false;
  private rutaActiva = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertCtrl: AlertController,
    public themeService: ThemeService
  ) {
    ScreenOrientation.lock({ orientation: 'portrait' });

    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.rutaActiva = e.urlAfterRedirects;
      this.mostrarTabs = !RUTAS_SIN_TABS.some(r => this.rutaActiva.startsWith(r));
    });
  }

  ngOnInit() {
    App.addListener('resume', () => {
      this.validarAutenticacion();
    });
    this.validarAutenticacion();
  }

  async navegar(ruta: string) {
    if (ruta === '/anadir-plaza' && !this.authService.estaLogado()) {
      const alert = await this.alertCtrl.create({
        header: 'Registro necesario',
        message: 'Para añadir una plaza PMR debes tener una cuenta. ¿Quieres iniciar sesión o registrarte?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
          },
          {
            text: 'Registrarse',
            handler: () => this.router.navigate(['/registro']),
          },
          {
            text: 'Iniciar sesión',
            handler: () => this.router.navigate(['/login']),
          },
        ],
      });
      await alert.present();
      return;
    }
    this.router.navigate([ruta]);
  }

  esRutaActiva(ruta: string): boolean {
    return this.rutaActiva.startsWith(ruta);
  }

  private validarAutenticacion() {
    if (this.authService.estaLogado()) {
      const currentUrl = this.router.url;
      if (currentUrl === '/login' || currentUrl === '/registro' || currentUrl === '') {
        this.router.navigate(['/home']);
      }
    } else {
      const currentUrl = this.router.url;
      if (currentUrl !== '/login' && currentUrl !== '/registro') {
        if (!currentUrl.includes('/home') && !currentUrl.includes('/detalle-plaza')) {
          this.router.navigate(['/login']);
        }
      }
    }
  }
}


