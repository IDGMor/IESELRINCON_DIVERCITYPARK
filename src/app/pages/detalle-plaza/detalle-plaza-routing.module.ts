import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DetallePlazaPage } from './detalle-plaza.page';

const routes: Routes = [{ path: '', component: DetallePlazaPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DetallePlazaPageRoutingModule {}