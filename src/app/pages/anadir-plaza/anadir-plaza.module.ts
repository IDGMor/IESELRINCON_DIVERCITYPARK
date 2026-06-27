import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AnadirPlazaPage } from './anadir-plaza.page';
import { AnadirPlazaPageRoutingModule } from './anadir-plaza-routing.module';
import { SharedModule } from '../../shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AnadirPlazaPageRoutingModule,
    SharedModule
  ],
  declarations: [AnadirPlazaPage]
})
export class AnadirPlazaModule { }
