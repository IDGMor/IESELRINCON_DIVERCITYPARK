import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { of } from 'rxjs';

import { DetallePlazaPage } from './detalle-plaza.page';
import { PlazaService } from '../../services/plaza.service';

const mockPlaza = {
  id: 1,
  nombre: 'Test Parking',
  descripcion: 'Descripción test',
  direccion: 'C. Test, 1',
  sector: 'Centro',
  latitude: 28.1235,
  longitude: -15.4366,
  disponibles: 1,
  total: 1,
  zona: 'azul' as const,
  senal_vertical: true,
  marcas_suelo: true,
  num_plazas: 1,
  estado: 'buen_estado' as const,
  ocupacion: 'libre' as const,
  incidencias_fisicas: '',
  acceso_furgonetas: true,
  pavimento: 'bueno' as const,
  iluminacion: 'suficiente' as const,
  pendiente: 'plana' as const,
  observaciones: '',
};

describe('DetallePlazaPage', () => {
  let component: DetallePlazaPage;
  let fixture: ComponentFixture<DetallePlazaPage>;
  let plazaServiceSpy: jasmine.SpyObj<PlazaService>;

  beforeEach(async () => {
    plazaServiceSpy = jasmine.createSpyObj('PlazaService', ['obtenerPlaza']);
    plazaServiceSpy.obtenerPlaza.and.returnValue(of(mockPlaza));

    await TestBed.configureTestingModule({
      declarations: [DetallePlazaPage],
      imports: [IonicModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: PlazaService, useValue: plazaServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DetallePlazaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar el plaza al iniciar', () => {
    expect(plazaServiceSpy.obtenerPlaza).toHaveBeenCalledWith(1);
    expect(component.plaza).toEqual(mockPlaza);
  });plaza

  it('debe mostrar el texto de ocupacion correcto', () => {
    expect(component.ocupacionTexto('libre')).toBe('Libre');
    expect(component.ocupacionTexto('ocupado')).toBe('Ocupado');
    expect(component.ocupacionTexto('desconocido')).toBe('Desconocido / Libre');
  });

  it('loading debe ser false tras cargar', () => {
    expect(component.loading).toBeFalse();
  });
});