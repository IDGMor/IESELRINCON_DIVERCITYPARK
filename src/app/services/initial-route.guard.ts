import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class InitialRouteGuard implements CanActivate {

  constructor(
    private router: Router
  ) {}

  canActivate(): boolean {
    this.router.navigate(['/home']);
    return false;
  }
}
