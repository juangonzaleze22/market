import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import {
  AdminService,
  AdminExpense,
  AdminExpenseSummary,
  AdminRecurringExpense,
  DashboardPeriod,
  ExpenseCategory,
  ExpenseKind,
} from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/ui/modal';

interface ExpenseFormState {
  id: string | null;
  date: string;
  amount: number | null;
  category: ExpenseCategory;
  kind: ExpenseKind;
  description: string;
  supplier: string;
  notes: string;
  receiptUrl: string;
}

interface RecurringFormState {
  id: string | null;
  description: string;
  amount: number | null;
  category: ExpenseCategory;
  kind: ExpenseKind;
  dayOfMonth: number;
  startDate: string;
  endDate: string;
  supplier: string;
  notes: string;
  isActive: boolean;
}

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'rent', label: 'Alquiler' },
  { value: 'remodeling', label: 'Remodelación' },
  { value: 'investment', label: 'Inversión' },
  { value: 'services', label: 'Servicios' },
  { value: 'payroll', label: 'Nómina' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'supplies', label: 'Insumos' },
  { value: 'other', label: 'Otros' },
];

const KINDS: { value: ExpenseKind; label: string }[] = [
  { value: 'operating', label: 'Operativo' },
  { value: 'investment', label: 'Inversión' },
];

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
  { value: 'all', label: 'Todo' },
];

function todayString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyExpenseForm(): ExpenseFormState {
  return {
    id: null,
    date: todayString(),
    amount: null,
    category: 'other',
    kind: 'operating',
    description: '',
    supplier: '',
    notes: '',
    receiptUrl: '',
  };
}

function emptyRecurringForm(): RecurringFormState {
  return {
    id: null,
    description: '',
    amount: null,
    category: 'rent',
    kind: 'operating',
    dayOfMonth: 1,
    startDate: todayString(),
    endDate: '',
    supplier: '',
    notes: '',
    isActive: true,
  };
}

@Component({
  selector: 'app-admin-expenses',
  imports: [FormsModule, CurrencyPipe, DatePipe, NgClass, ModalComponent],
  template: `
    <div class="space-y-2xl" data-testid="admin-expenses">
      <div class="flex flex-wrap items-center justify-between gap-lg">
        <h1 class="text-body-2xl font-bold" data-testid="expenses-title">Gastos<span class="text-accent">.</span></h1>
        <button type="button" class="btn-primary" data-testid="new-expense" (click)="openCreateExpense()">
          Nuevo gasto
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-xs" data-testid="expenses-period-selector">
        @for (option of periodOptions; track option.value) {
          <button
            type="button"
            class="px-md py-sm rounded-pill text-body-sm font-medium border transition-colors"
            [ngClass]="period() === option.value ? 'bg-ink text-on-primary border-ink' : 'bg-canvas text-body border-surface-pressed hover:border-ink'"
            [attr.data-testid]="'expenses-period-' + option.value"
            (click)="changePeriod(option.value)"
          >
            {{ option.label }}
          </button>
        }
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-lg" data-testid="expenses-summary">
        <div class="bg-canvas rounded-xl p-xl border border-surface-pressed" data-testid="summary-operating">
          <p class="text-body-md text-body">Gastos operativos</p>
          <p class="text-body-xl font-bold text-ink mt-xs">{{ summary()?.operatingTotal | currency }}</p>
        </div>
        <div class="bg-canvas rounded-xl p-xl border border-surface-pressed" data-testid="summary-investment">
          <p class="text-body-md text-body">Inversiones</p>
          <p class="text-body-xl font-bold text-ink mt-xs">{{ summary()?.investmentTotal | currency }}</p>
        </div>
        <div class="bg-canvas rounded-xl p-xl border border-surface-pressed" data-testid="summary-total">
          <p class="text-body-md text-body">Total egresos</p>
          <p class="text-body-xl font-bold text-ink mt-xs">{{ summary()?.total | currency }}</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-md">
        <div class="flex items-center gap-xs" data-testid="expenses-tabs">
          <button
            type="button"
            class="px-md py-sm rounded-pill text-body-sm font-medium border"
            [ngClass]="tab() === 'expenses' ? 'bg-ink text-on-primary border-ink' : 'bg-canvas text-body border-surface-pressed'"
            data-testid="tab-expenses"
            (click)="tab.set('expenses')"
          >Gastos</button>
          <button
            type="button"
            class="px-md py-sm rounded-pill text-body-sm font-medium border"
            [ngClass]="tab() === 'recurring' ? 'bg-ink text-on-primary border-ink' : 'bg-canvas text-body border-surface-pressed'"
            data-testid="tab-recurring"
            (click)="tab.set('recurring')"
          >Recurrentes</button>
        </div>

        @if (tab() === 'recurring') {
          <button type="button" class="btn-secondary" data-testid="new-recurring" (click)="openCreateRecurring()">
            Nuevo recurrente
          </button>
        }
      </div>

      @if (tab() === 'expenses') {
        <div class="flex flex-wrap items-center gap-md" data-testid="expenses-filters">
          <input
            type="search"
            class="filter-input"
            placeholder="Buscar gasto..."
            [ngModel]="search()"
            (ngModelChange)="onSearch($event)"
            data-testid="expenses-search"
          />
          <select
            class="filter-input"
            [ngModel]="category()"
            (ngModelChange)="onCategoryChange($event)"
            data-testid="expenses-category-filter"
          >
            <option value="">Todas las categorías</option>
            @for (item of categories; track item.value) {
              <option [value]="item.value">{{ item.label }}</option>
            }
          </select>
          <select
            class="filter-input"
            [ngModel]="kind()"
            (ngModelChange)="onKindChange($event)"
            data-testid="expenses-kind-filter"
          >
            <option value="">Todos los tipos</option>
            @for (item of kinds; track item.value) {
              <option [value]="item.value">{{ item.label }}</option>
            }
          </select>
        </div>

        <div class="bg-canvas rounded-xl border border-surface-pressed" data-testid="expenses-list">
          @if (loading()) {
            <div class="flex items-center justify-center py-4xl">
              <div class="w-8 h-8 border-2 border-surface-pressed border-t-primary rounded-full animate-spin"></div>
            </div>
          } @else {
            <div class="divide-y divide-surface-pressed">
              @for (expense of expenses(); track expense.id) {
                <div class="px-xl py-lg flex flex-wrap items-center gap-md" [attr.data-testid]="'expense-row-' + expense.id">
                  <div class="w-24 shrink-0 text-body-sm text-body">{{ expense.date | date:'dd/MM/yyyy' }}</div>
                  <div class="flex-1 min-w-0">
                    <p class="text-body-sm-strong truncate">{{ expense.description }}</p>
                    <p class="text-body-xs text-body">
                      {{ categoryLabel(expense.category) }}
                      @if (expense.supplier) { · {{ expense.supplier }} }
                    </p>
                  </div>
                  <span class="rounded-pill px-sm py-xxs text-body-xs font-medium" [ngClass]="kindClass(expense.kind)">
                    {{ kindLabel(expense.kind) }}
                  </span>
                  @if (expense.recurringExpenseId) {
                    <span class="rounded-pill px-sm py-xxs text-body-xs font-medium bg-blue-50 text-blue-700">Recurrente</span>
                  }
                  <span class="text-body-sm-strong w-24 text-right">{{ expense.amount | currency }}</span>
                  <div class="flex items-center gap-xs">
                    <button type="button" class="text-body-sm text-link hover:underline" [attr.data-testid]="'edit-expense-' + expense.id" (click)="openEditExpense(expense)">Editar</button>
                    <button type="button" class="text-body-sm text-red-600 hover:underline" [attr.data-testid]="'delete-expense-' + expense.id" (click)="deleteExpense(expense)">Eliminar</button>
                  </div>
                </div>
              } @empty {
                <div class="px-xl py-2xl text-center text-body text-body-sm">No hay gastos en este período</div>
              }
            </div>

            @if (totalPages() > 1) {
              <div class="px-xl py-lg border-t border-surface-pressed flex items-center justify-between">
                <button type="button" class="btn-secondary" [disabled]="page() <= 1" (click)="changePage(page() - 1)">Anterior</button>
                <span class="text-body-sm text-body">Página {{ page() }} de {{ totalPages() }}</span>
                <button type="button" class="btn-secondary" [disabled]="page() >= totalPages()" (click)="changePage(page() + 1)">Siguiente</button>
              </div>
            }
          }
        </div>
      } @else {
        <div class="bg-canvas rounded-xl border border-surface-pressed" data-testid="recurring-list">
          <div class="divide-y divide-surface-pressed">
            @for (item of recurring(); track item.id) {
              <div class="px-xl py-lg flex flex-wrap items-center gap-md" [attr.data-testid]="'recurring-row-' + item.id">
                <div class="flex-1 min-w-0">
                  <p class="text-body-sm-strong truncate">{{ item.description }}</p>
                  <p class="text-body-xs text-body">
                    Día {{ item.dayOfMonth }} · {{ categoryLabel(item.category) }} · desde {{ item.startDate | date:'dd/MM/yyyy' }}
                  </p>
                </div>
                <span class="rounded-pill px-sm py-xxs text-body-xs font-medium" [ngClass]="kindClass(item.kind)">
                  {{ kindLabel(item.kind) }}
                </span>
                <span class="rounded-pill px-sm py-xxs text-body-xs font-medium" [ngClass]="item.isActive ? 'bg-green-50 text-green-700' : 'bg-canvas-soft text-body'">
                  {{ item.isActive ? 'Activo' : 'Inactivo' }}
                </span>
                <span class="text-body-sm-strong w-24 text-right">{{ item.amount | currency }}</span>
                <div class="flex items-center gap-xs">
                  <button type="button" class="text-body-sm text-link hover:underline" [attr.data-testid]="'edit-recurring-' + item.id" (click)="openEditRecurring(item)">Editar</button>
                  <button type="button" class="text-body-sm text-red-600 hover:underline" [attr.data-testid]="'delete-recurring-' + item.id" (click)="deleteRecurring(item)">Eliminar</button>
                </div>
              </div>
            } @empty {
              <div class="px-xl py-2xl text-center text-body text-body-sm">No hay gastos recurrentes</div>
            }
          </div>
        </div>
      }
    </div>

    <!-- Modal gasto -->
    <app-modal
      [open]="expenseFormOpen()"
      [title]="expenseForm().id ? 'Editar gasto' : 'Nuevo gasto'"
      size="form"
      testId="expense-modal"
      (closed)="expenseFormOpen.set(false)"
    >
      <div class="space-y-lg">
        @if (expenseError()) {
          <p class="form-error">{{ expenseError() }}</p>
        }
        <p class="form-hint">Los campos con <span class="text-red-600">*</span> son obligatorios.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div>
            <label class="form-label" for="expense-date">Fecha <span class="text-red-600">*</span></label>
            <input id="expense-date" type="date" class="form-input w-full" [ngModel]="expenseForm().date" (ngModelChange)="patchExpense({ date: $event })" data-testid="expense-date" />
          </div>
          <div>
            <label class="form-label" for="expense-amount">Monto <span class="text-red-600">*</span></label>
            <input id="expense-amount" type="number" min="0" step="0.01" class="form-input w-full" [ngModel]="expenseForm().amount" (ngModelChange)="patchExpense({ amount: $event ? +$event : null })" data-testid="expense-amount" />
          </div>
          <div>
            <label class="form-label" for="expense-category">Categoría <span class="text-red-600">*</span></label>
            <select id="expense-category" class="form-input w-full" [ngModel]="expenseForm().category" (ngModelChange)="patchExpense({ category: $event })" data-testid="expense-category">
              @for (item of categories; track item.value) {
                <option [value]="item.value">{{ item.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="form-label" for="expense-kind">Tipo <span class="text-red-600">*</span></label>
            <select id="expense-kind" class="form-input w-full" [ngModel]="expenseForm().kind" (ngModelChange)="patchExpense({ kind: $event })" data-testid="expense-kind">
              @for (item of kinds; track item.value) {
                <option [value]="item.value">{{ item.label }}</option>
              }
            </select>
          </div>
        </div>
        <div>
          <label class="form-label" for="expense-description">Descripción <span class="text-red-600">*</span></label>
          <input id="expense-description" type="text" class="form-input w-full" [ngModel]="expenseForm().description" (ngModelChange)="patchExpense({ description: $event })" data-testid="expense-description" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div>
            <label class="form-label" for="expense-supplier">Proveedor</label>
            <input id="expense-supplier" type="text" class="form-input w-full" [ngModel]="expenseForm().supplier" (ngModelChange)="patchExpense({ supplier: $event })" data-testid="expense-supplier" />
          </div>
          <div>
            <label class="form-label" for="expense-receipt">Comprobante (URL)</label>
            <input id="expense-receipt" type="text" class="form-input w-full" [ngModel]="expenseForm().receiptUrl" (ngModelChange)="patchExpense({ receiptUrl: $event })" data-testid="expense-receipt" />
          </div>
        </div>
        <div>
          <label class="form-label" for="expense-notes">Notas</label>
          <textarea id="expense-notes" class="form-input w-full" rows="2" [ngModel]="expenseForm().notes" (ngModelChange)="patchExpense({ notes: $event })" data-testid="expense-notes"></textarea>
        </div>
      </div>
      <div modalFooter class="flex items-center justify-end gap-md w-full">
        <button type="button" class="btn-secondary" (click)="expenseFormOpen.set(false)">Cancelar</button>
        <button type="button" class="btn-primary" [disabled]="saving()" data-testid="save-expense" (click)="saveExpense()">
          {{ saving() ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </app-modal>

    <!-- Modal recurrente -->
    <app-modal
      [open]="recurringFormOpen()"
      [title]="recurringForm().id ? 'Editar gasto recurrente' : 'Nuevo gasto recurrente'"
      size="form"
      testId="recurring-modal"
      (closed)="recurringFormOpen.set(false)"
    >
      <div class="space-y-lg">
        @if (recurringError()) {
          <p class="form-error">{{ recurringError() }}</p>
        }
        <p class="form-hint">Los campos con <span class="text-red-600">*</span> son obligatorios.</p>
        <div>
          <label class="form-label" for="recurring-description">Descripción <span class="text-red-600">*</span></label>
          <input id="recurring-description" type="text" class="form-input w-full" [ngModel]="recurringForm().description" (ngModelChange)="patchRecurring({ description: $event })" data-testid="recurring-description" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div>
            <label class="form-label" for="recurring-amount">Monto <span class="text-red-600">*</span></label>
            <input id="recurring-amount" type="number" min="0" step="0.01" class="form-input w-full" [ngModel]="recurringForm().amount" (ngModelChange)="patchRecurring({ amount: $event ? +$event : null })" data-testid="recurring-amount" />
          </div>
          <div>
            <label class="form-label" for="recurring-day">Día del mes <span class="text-red-600">*</span></label>
            <input id="recurring-day" type="number" min="1" max="28" class="form-input w-full" [ngModel]="recurringForm().dayOfMonth" (ngModelChange)="patchRecurring({ dayOfMonth: +$event })" data-testid="recurring-day" />
          </div>
          <div>
            <label class="form-label" for="recurring-category">Categoría <span class="text-red-600">*</span></label>
            <select id="recurring-category" class="form-input w-full" [ngModel]="recurringForm().category" (ngModelChange)="patchRecurring({ category: $event })" data-testid="recurring-category">
              @for (item of categories; track item.value) {
                <option [value]="item.value">{{ item.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="form-label" for="recurring-kind">Tipo <span class="text-red-600">*</span></label>
            <select id="recurring-kind" class="form-input w-full" [ngModel]="recurringForm().kind" (ngModelChange)="patchRecurring({ kind: $event })" data-testid="recurring-kind">
              @for (item of kinds; track item.value) {
                <option [value]="item.value">{{ item.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="form-label" for="recurring-start">Inicio <span class="text-red-600">*</span></label>
            <input id="recurring-start" type="date" class="form-input w-full" [ngModel]="recurringForm().startDate" (ngModelChange)="patchRecurring({ startDate: $event })" data-testid="recurring-start" />
          </div>
          <div>
            <label class="form-label" for="recurring-end">Fin (opcional)</label>
            <input id="recurring-end" type="date" class="form-input w-full" [ngModel]="recurringForm().endDate" (ngModelChange)="patchRecurring({ endDate: $event })" data-testid="recurring-end" />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div>
            <label class="form-label" for="recurring-supplier">Proveedor</label>
            <input id="recurring-supplier" type="text" class="form-input w-full" [ngModel]="recurringForm().supplier" (ngModelChange)="patchRecurring({ supplier: $event })" data-testid="recurring-supplier" />
          </div>
          <div class="flex items-end">
            <label class="flex items-center gap-sm text-body-sm text-body">
              <input type="checkbox" [ngModel]="recurringForm().isActive" (ngModelChange)="patchRecurring({ isActive: $event })" data-testid="recurring-active" />
              Activo
            </label>
          </div>
        </div>
        <div>
          <label class="form-label" for="recurring-notes">Notas</label>
          <textarea id="recurring-notes" class="form-input w-full" rows="2" [ngModel]="recurringForm().notes" (ngModelChange)="patchRecurring({ notes: $event })" data-testid="recurring-notes"></textarea>
        </div>
      </div>
      <div modalFooter class="flex items-center justify-end gap-md w-full">
        <button type="button" class="btn-secondary" (click)="recurringFormOpen.set(false)">Cancelar</button>
        <button type="button" class="btn-primary" [disabled]="saving()" data-testid="save-recurring" (click)="saveRecurring()">
          {{ saving() ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </app-modal>
  `,
})
export class AdminExpenses implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly categories = CATEGORIES;
  protected readonly kinds = KINDS;
  protected readonly periodOptions = PERIOD_OPTIONS;

  protected readonly tab = signal<'expenses' | 'recurring'>('expenses');
  protected readonly period = signal<DashboardPeriod>('month');
  protected readonly category = signal('');
  protected readonly kind = signal('');
  protected readonly search = signal('');
  protected readonly expenses = signal<AdminExpense[]>([]);
  protected readonly summary = signal<AdminExpenseSummary | null>(null);
  protected readonly recurring = signal<AdminRecurringExpense[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(0);

  protected readonly expenseFormOpen = signal(false);
  protected readonly expenseForm = signal<ExpenseFormState>(emptyExpenseForm());
  protected readonly expenseError = signal('');

  protected readonly recurringFormOpen = signal(false);
  protected readonly recurringForm = signal<RecurringFormState>(emptyRecurringForm());
  protected readonly recurringError = signal('');

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadSummary();
    this.loadExpenses();
    this.loadRecurring();
  }

  protected changePeriod(period: DashboardPeriod): void {
    if (this.period() === period) return;
    this.period.set(period);
    this.page.set(1);
    this.loadSummary();
    this.loadExpenses();
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadExpenses();
    }, 250);
  }

  protected onCategoryChange(value: string): void {
    this.category.set(value);
    this.page.set(1);
    this.loadExpenses();
  }

  protected onKindChange(value: string): void {
    this.kind.set(value);
    this.page.set(1);
    this.loadExpenses();
  }

  protected changePage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.loadExpenses();
  }

  private loadExpenses(): void {
    this.loading.set(true);
    this.adminService
      .getExpenses(
        this.page(),
        20,
        this.period(),
        this.category(),
        this.kind(),
        this.search(),
      )
      .subscribe({
        next: (response) => {
          this.expenses.set(response.data);
          this.totalPages.set(response.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private loadSummary(): void {
    this.adminService.getExpenseSummary(this.period()).subscribe({
      next: (summary) => this.summary.set(summary),
    });
  }

  private loadRecurring(): void {
    this.adminService.getRecurringExpenses().subscribe({
      next: (items) => this.recurring.set(items),
    });
  }

  protected openCreateExpense(): void {
    this.expenseForm.set(emptyExpenseForm());
    this.expenseError.set('');
    this.expenseFormOpen.set(true);
  }

  protected openEditExpense(expense: AdminExpense): void {
    this.expenseForm.set({
      id: expense.id,
      date: expense.date.slice(0, 10),
      amount: Number(expense.amount),
      category: expense.category,
      kind: expense.kind,
      description: expense.description,
      supplier: expense.supplier ?? '',
      notes: expense.notes ?? '',
      receiptUrl: expense.receiptUrl ?? '',
    });
    this.expenseError.set('');
    this.expenseFormOpen.set(true);
  }

  protected patchExpense(values: Partial<ExpenseFormState>): void {
    this.expenseForm.update((form) => ({ ...form, ...values }));
  }

  protected saveExpense(): void {
    const form = this.expenseForm();
    if (!form.date || !form.amount || form.amount <= 0 || !form.description.trim()) {
      this.expenseError.set('Fecha, monto y descripción son obligatorios');
      return;
    }

    this.saving.set(true);
    const payload = {
      date: form.date,
      amount: Number(form.amount),
      category: form.category,
      kind: form.kind,
      description: form.description.trim(),
      supplier: form.supplier || undefined,
      notes: form.notes || undefined,
      receiptUrl: form.receiptUrl || undefined,
    };

    const request = form.id
      ? this.adminService.updateExpense(form.id, payload)
      : this.adminService.createExpense(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.expenseFormOpen.set(false);
        this.toast.success(form.id ? 'Gasto actualizado' : 'Gasto registrado');
        this.loadExpenses();
        this.loadSummary();
      },
      error: (err) => {
        this.saving.set(false);
        this.expenseError.set(this.errorMessage(err, 'No se pudo guardar el gasto'));
      },
    });
  }

  protected deleteExpense(expense: AdminExpense): void {
    if (!confirm(`¿Eliminar "${expense.description}"?`)) return;
    this.adminService.deleteExpense(expense.id).subscribe({
      next: () => {
        this.toast.success('Gasto eliminado');
        this.loadExpenses();
        this.loadSummary();
      },
      error: (err) => this.toast.error(this.errorMessage(err, 'No se pudo eliminar el gasto')),
    });
  }

  protected openCreateRecurring(): void {
    this.recurringForm.set(emptyRecurringForm());
    this.recurringError.set('');
    this.recurringFormOpen.set(true);
  }

  protected openEditRecurring(item: AdminRecurringExpense): void {
    this.recurringForm.set({
      id: item.id,
      description: item.description,
      amount: Number(item.amount),
      category: item.category,
      kind: item.kind,
      dayOfMonth: item.dayOfMonth,
      startDate: item.startDate.slice(0, 10),
      endDate: item.endDate ? item.endDate.slice(0, 10) : '',
      supplier: item.supplier ?? '',
      notes: item.notes ?? '',
      isActive: item.isActive,
    });
    this.recurringError.set('');
    this.recurringFormOpen.set(true);
  }

  protected patchRecurring(values: Partial<RecurringFormState>): void {
    this.recurringForm.update((form) => ({ ...form, ...values }));
  }

  protected saveRecurring(): void {
    const form = this.recurringForm();
    if (!form.description.trim() || !form.amount || form.amount <= 0 || !form.startDate) {
      this.recurringError.set('Descripción, monto y fecha de inicio son obligatorios');
      return;
    }
    if (form.dayOfMonth < 1 || form.dayOfMonth > 28) {
      this.recurringError.set('El día del mes debe estar entre 1 y 28');
      return;
    }

    this.saving.set(true);
    const payload = {
      description: form.description.trim(),
      amount: Number(form.amount),
      category: form.category,
      kind: form.kind,
      dayOfMonth: Number(form.dayOfMonth),
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      supplier: form.supplier || undefined,
      notes: form.notes || undefined,
      isActive: form.isActive,
    };

    const request = form.id
      ? this.adminService.updateRecurringExpense(form.id, payload)
      : this.adminService.createRecurringExpense(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.recurringFormOpen.set(false);
        this.toast.success(form.id ? 'Recurrente actualizado' : 'Recurrente creado');
        this.loadRecurring();
        this.loadExpenses();
        this.loadSummary();
      },
      error: (err) => {
        this.saving.set(false);
        this.recurringError.set(this.errorMessage(err, 'No se pudo guardar el recurrente'));
      },
    });
  }

  protected deleteRecurring(item: AdminRecurringExpense): void {
    if (!confirm(`¿Eliminar el recurrente "${item.description}"? Los gastos ya generados se conservan.`)) {
      return;
    }
    this.adminService.deleteRecurringExpense(item.id).subscribe({
      next: () => {
        this.toast.success('Recurrente eliminado');
        this.loadRecurring();
        this.loadExpenses();
        this.loadSummary();
      },
      error: (err) => this.toast.error(this.errorMessage(err, 'No se pudo eliminar el recurrente')),
    });
  }

  protected categoryLabel(category: string): string {
    return CATEGORIES.find((item) => item.value === category)?.label ?? category;
  }

  protected kindLabel(kind: string): string {
    return KINDS.find((item) => item.value === kind)?.label ?? kind;
  }

  protected kindClass(kind: string): string {
    return kind === 'investment'
      ? 'bg-violet-50 text-violet-700'
      : 'bg-canvas-soft text-body';
  }

  private errorMessage(err: any, fallback: string): string {
    const message = err?.error?.message;
    if (Array.isArray(message)) return message.join(', ');
    return message ?? fallback;
  }
}
