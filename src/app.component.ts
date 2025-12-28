import { Component, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BankService, Bank } from './services/bank.service';
import { BankTableComponent } from './components/bank-table.component';

@Component({
  selector: 'app-bank-mfe',
  standalone: true,
  imports: [BankTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  private bankService = inject(BankService);

  banks = signal<Bank[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.fetchData();
  }

  async fetchData() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.bankService.getBanks();
      this.banks.set(data);
    } catch (err) {
      this.error.set('Hubo un error al cargar la lista de bancos. Por favor intente nuevamente.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  reload() {
    this.fetchData();
  }
}