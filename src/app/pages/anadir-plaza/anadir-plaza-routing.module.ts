import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AnadirPlazaPage } from './anadir-plaza.page';

const routes: Routes = [
  {
    path: '',
    component: AnadirPlazaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AnadirPlazaPageRoutingModule {}
