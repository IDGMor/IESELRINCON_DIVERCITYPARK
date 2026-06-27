import { TestBed } from '@angular/core/testing';

import { AparcamientoService } from './aparcamiento.service';

describe('AparcamientoService', () => {
  let service: AparcamientoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AparcamientoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
