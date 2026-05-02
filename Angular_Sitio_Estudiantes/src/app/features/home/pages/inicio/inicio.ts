import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-inicio-page',
  standalone: true,
  imports: [RouterLink, CardModule, ButtonModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class InicioPage {
  protected readonly auth = inject(AuthService);
}
