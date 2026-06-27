import { Component, OnInit } from '@angular/core';
import { RankingService, RankingUsuario } from '../../services/ranking.service';
import { FontScaleService } from '../../services/font-scale.service';

@Component({
  selector: 'app-ranking',
  templateUrl: 'ranking.page.html',
  styleUrls: ['ranking.page.scss'],
  standalone: false,
})
export class RankingPage implements OnInit {

  ranking: RankingUsuario[] = [];
  total   = 0;
  loading = false;
  error   = '';

  get fontScale(): number { return this.fontScaleService.scale; }

  constructor(
    private rankingService: RankingService,
    public fontScaleService: FontScaleService,
  ) {}

  ngOnInit() {
    this.cargarRanking();
  }

  cargarRanking() {
    this.loading = true;
    this.error   = '';
    this.rankingService.obtenerRanking(20).subscribe({
      next: (res) => {
        this.ranking = res.ranking;
        this.total   = res.total;
        this.loading = false;
      },
      error: () => {
        this.error   = 'No se pudo cargar el ranking. Inténtalo de nuevo.';
        this.loading = false;
      }
    });
  }
}
