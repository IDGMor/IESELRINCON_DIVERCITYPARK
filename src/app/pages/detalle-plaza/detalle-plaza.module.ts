import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DetallePlazaPageRoutingModule } from './detalle-plaza-routing.module';
import { DetallePlazaPage } from './detalle-plaza.page';
import { SharedModule } from '../../shared.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, DetallePlazaPageRoutingModule, SharedModule],
  declarations: [DetallePlazaPage]
})
export class DetallePlazaModule {}
