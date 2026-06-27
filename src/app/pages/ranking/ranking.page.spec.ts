import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { of, throwError } from 'rxjs';

import { RankingPage } from './ranking.page';
import { RankingService, RankingUsuario } from '../../services/ranking.service';

const mockRanking: RankingUsuario[] = [
  { id: 1, nombre: 'Usuario Uno',  puntos: 300, plazas_anadidos: 10, incidencias_reportadas: 5 },
  { id: 2, nombre: 'Usuario Dos',  puntos: 200, plazas_anadidos: 7,  incidencias_reportadas: 3 },
  { id: 3, nombre: 'Usuario Tres', puntos: 100, plazas_anadidos: 3,  incidencias_reportadas: 1 },
];

describe('RankingPage', () => {
  let component: RankingPage;
  let fixture: ComponentFixture<RankingPage>;
  let rankingServiceSpy: jasmine.SpyObj<RankingService>;

  beforeEach(async () => {
    rankingServiceSpy = jasmine.createSpyObj('RankingService', ['obtenerRanking']);
    rankingServiceSpy.obtenerRanking.and.returnValue(of(mockRanking));

    await TestBed.configureTestingModule({
      declarations: [RankingPage],
      imports: [IonicModule.forRoot()],
      providers: [{ provide: RankingService, useValue: rankingServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(RankingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar el ranking al iniciar', () => {
    expect(rankingServiceSpy.obtenerRanking).toHaveBeenCalled();
    expect(component.ranking.length).toBe(3);
  });

  it('loading debe ser false tras cargar', () => {
    expect(component.loading).toBeFalse();
  });

  it('debe mostrar error si el servicio falla', () => {
    rankingServiceSpy.obtenerRanking.and.returnValue(throwError(() => new Error('Error')));
    component.cargarRanking();
    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });
});