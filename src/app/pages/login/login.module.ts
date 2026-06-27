import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LoginPage } from './login.page';
import { LoginPageRoutingModule } from './login-routing.module';
import { SharedModule } from '../../shared.module';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, IonicModule, LoginPageRoutingModule, SharedModule],
  declarations: [LoginPage]
})
export class LoginModule {}
