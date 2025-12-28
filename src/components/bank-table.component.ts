import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { Bank } from '../services/bank.service';

@Component({
  selector: 'app-bank-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
      <table class="w-full text-left text-sm text-slate-600">
        <thead class="bg-slate-100 text-xs uppercase font-semibold text-slate-500">
          <tr>
            <th scope="col" class="px-6 py-4">Banco</th>
            <th scope="col" class="px-6 py-4">Tipo</th>
            <th scope="col" class="px-6 py-4">Descripción</th>
            <th scope="col" class="px-6 py-4 text-right">Acción</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          @for (bank of banks(); track bank.name) {
            <tr class="hover:bg-slate-50 transition-colors duration-150">
              <td class="px-6 py-4 font-medium text-slate-900">
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    {{ bank.name.charAt(0) }}
                  </div>
                  {{ bank.name }}
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                  {{ bank.type }}
                </span>
              </td>
              <td class="px-6 py-4 max-w-xs truncate" [title]="bank.description">
                {{ bank.description }}
              </td>
              <td class="px-6 py-4 text-right">
                <a [href]="bank.website" target="_blank" rel="noopener noreferrer" 
                   class="text-indigo-600 hover:text-indigo-900 font-medium text-xs hover:underline">
                  Visitar
                </a>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    @if (banks().length === 0) {
      <div class="p-8 text-center text-slate-500">
        No se encontraron datos.
      </div>
    }
  `
})
export class BankTableComponent {
  banks = input.required<Bank[]>();
}