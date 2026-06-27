import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { InitialRouteGuard } from './services/initial-route.guard';
import { AuthGuard } from './services/auth.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [InitialRouteGuard],
    component: undefined  // No renderiza nada, solo redirecciona
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginModule)
  },
  {
    path: 'registro',
    loadChildren: () => import('./pages/registro/registro.module').then(m => m.RegistroModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'perfil',
    loadChildren: () => import('./pages/perfil/perfil.module').then(m => m.PerfilModule)
  },
  {
    path: 'anadir-plaza',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/anadir-plaza/anadir-plaza.module').then(m => m.AnadirPlazaModule)
  },
  {
    path: 'ranking',
    loadChildren: () => import('./pages/ranking/ranking.module').then(m => m.RankingModule)
  },
  {
    path: 'incidencias',
    loadChildren: () => import('./pages/incidencias/incidencias.module').then(m => m.IncidenciasModule)
  },
  {
    path: 'detalle-plaza/:id',
    loadChildren: () => import('./pages/detalle-plaza/detalle-plaza.module').then(m => m.DetallePlazaModule)
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

