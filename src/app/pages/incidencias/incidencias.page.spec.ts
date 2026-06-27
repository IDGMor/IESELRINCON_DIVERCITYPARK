import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { IncidenciasPage } from './incidencias.page';
import { IncidenciasService } from '../../services/incidencias.service';
import { PlazaService } from '../../services/plaza.service';

describe('IncidenciasPage', () => {
  let component: IncidenciasPage;
  let fixture: ComponentFixture<IncidenciasPage>;
  let incidenciasServiceSpy: jasmine.SpyObj<IncidenciasService>;
  let plazaServiceSpy: jasmine.SpyObj<PlazaService>;

  beforeEach(async () => {
    incidenciasServiceSpy = jasmine.createSpyObj('IncidenciasService', ['crearIncidencia']);
    incidenciasServiceSpy.crearIncidencia.and.returnValue(
      of({ mensaje: 'OK', puntos_otorgados: 10 })
    );

    plazaServiceSpy = jasmine.createSpyObj('PlazaService', ['obtenerPlazas']);
    plazaServiceSpy.obtenerPlazas.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [IncidenciasPage],
      imports: [IonicModule.forRoot(), RouterTestingModule, FormsModule],
      providers: [
        { provide: IncidenciasService,   useValue: incidenciasServiceSpy },
        { provide: PlazaService,  useValue: plazaServiceSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IncidenciasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formulario invalido si faltan campos obligatorios', () => {
    expect(component.formularioValido()).toBeFalse();
  });

  it('formulario valido con plaza y tipo', () => {
    component.form.plaza_id = 1;
    component.form.tipo = 'mal_aparcado';
    expect(component.formularioValido()).toBeTrue();
  });

  it('no debe enviar si el formulario es invalido', () => {
    component.enviar();
    expect(incidenciasServiceSpy.crearIncidencia).not.toHaveBeenCalled();
  });

  it('debe marcar enviado tras envio correcto', () => {
    component.form.plaza_id = 1;
    component.form.tipo = 'mal_aparcado';
    component.enviar();
    expect(component.enviado).toBeTrue();
  });

  it('nueva() debe resetear el formulario', () => {
    component.enviado = true;
    component.nueva();
    expect(component.enviado).toBeFalse();
    expect(component.form.plaza_id).toBeNull();
    expect(component.form.tipo).toBeNull();
  });
});