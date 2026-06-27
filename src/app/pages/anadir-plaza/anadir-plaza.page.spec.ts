import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnadirPlazaPage } from './anadir-plaza.page';

describe('AnadirPlazaPage', () => {
  let component: AnadirPlazaPage;
  let fixture: ComponentFixture<AnadirPlazaPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnadirPlazaPage ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnadirPlazaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
