import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeService } from './shared/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Angular Ecommerce Dashboard | TailAdmin';
  private readonly theme = inject(ThemeService);

  ngOnInit(): void {
    this.theme.setTheme(this.theme.current);
    const savedDir = localStorage.getItem('dir');
    if (savedDir === 'rtl') {
      document.documentElement.setAttribute('dir', 'rtl');
    }
  }
}
