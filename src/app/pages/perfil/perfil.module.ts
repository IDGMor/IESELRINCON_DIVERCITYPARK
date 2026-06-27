import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { PerfilPage } from './perfil.page';
import { PerfilPageRoutingModule } from './perfil-routing.module';
import { SharedModule } from '../../shared.module';

@NgModule({
  imports: [CommonModule, IonicModule, PerfilPageRoutingModule, SharedModule],
  declarations: [PerfilPage]
})
export class PerfilModule {}
