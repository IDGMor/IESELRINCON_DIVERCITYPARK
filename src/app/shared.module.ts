import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FontScaleButtonComponent } from './components/font-scale-button/font-scale-button.component';

@NgModule({
  declarations: [FontScaleButtonComponent],
  imports: [CommonModule, IonicModule],
  exports: [FontScaleButtonComponent],
})
export class SharedModule {}
