// incidencias.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IncidenciasPageRoutingModule } from './incidencias-routing.module';
import { IncidenciasPage } from './incidencias.page';
import { SharedModule } from '../../shared.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, IncidenciasPageRoutingModule, SharedModule],
  declarations: [IncidenciasPage]
})
export class IncidenciasModule {}
