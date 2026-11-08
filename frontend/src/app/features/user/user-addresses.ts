import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  Address,
  AddressPayload,
  AddressService,
} from '../../core/services/address.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import {
  BranchService,
  DeliveryZone,
} from '../../core/services/branch.service';
import { ToastService } from '../../core/services/toast.service';
import { MapPicker } from '../../shared/ui/map-picker';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-addresses',
  imports: [RouterLink, FormsModule, MapPicker],
  template: `
    <section class="py-3xl max-w-[72rem] mx-auto px-lg" data-testid="addresses-page">
      @if (!auth.isAuthed()) {
        <div class="bg-canvas rounded-xl p-3xl text-center border border-surface-pressed">
          <p class="text-body-lg mb-xl">Iniciá sesión para gestionar tus direcciones</p>
          <button type="button" class="btn-primary" (click)="authModal.openLogin()">Iniciar sesión</button>
        </div>
      } @else {
        <!-- Breadcrumb -->
        <div class="flex items-center gap-sm text-body-sm text-body mb-lg">
          <a routerLink="/" class="hover:text-primary transition">Inicio</a>
          <span>/</span>
          <a routerLink="/account" class="hover:text-primary transition">Mi Cuenta</a>
          <span>/</span>
          <span class="text-ink font-medium">Direcciones</span>
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between gap-lg flex-wrap mb-xl">
          <div>
            <h1 class="text-display-md font-bold">Mis Direcciones</h1>
            <p class="text-body-sm text-body mt-xxs">
              Gestioná las direcciones donde querés recibir tus pedidos
            </p>
          </div>
          <button
            type="button"
            class="btn-primary inline-flex items-center gap-sm"
            (click)="openCreate()"
            data-testid="add-address"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Agregar dirección
          </button>
        </div>

        @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div class="h-40 bg-canvas-softer rounded-xl animate-pulse"></div>
            <div class="h-40 bg-canvas-softer rounded-xl animate-pulse"></div>
          </div>
        } @else if (addresses().length === 0) {
          <div
            class="bg-canvas rounded-xl border border-dashed border-surface-pressed p-3xl text-center"
            data-testid="addresses-empty"
          >
            <div class="w-16 h-16 rounded-full bg-canvas-softer grid place-items-center mx-auto mb-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-mute)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <p class="text-body-lg font-semibold mb-xs">Todavía no tenés direcciones</p>
            <p class="text-body text-body mb-xl">Agregá tu primera dirección para agilizar tus próximas compras.</p>
            <button type="button" class="btn-primary" (click)="openCreate()">Agregar dirección</button>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-lg" data-testid="addresses-list">
            @for (addr of addresses(); track addr.id) {
              <article
                class="bg-canvas rounded-xl border p-2xl flex flex-col"
                [class.border-primary]="addr.isDefault"
                [class.border-surface-pressed]="!addr.isDefault"
                data-testid="address-card"
              >
                <div class="flex items-start justify-between gap-md mb-md">
                  <div class="flex items-center gap-sm min-w-0">
                    <span class="w-9 h-9 rounded-lg bg-canvas-softer grid place-items-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </span>
                    <div class="min-w-0">
                      <p class="text-body-md-strong font-semibold truncate" data-testid="address-card-label">
                        {{ addr.label || 'Dirección' }}
                      </p>
                      @if (addr.isDefault) {
                        <span class="inline-block bg-primary/10 text-primary text-caption font-medium px-2 py-0.5 rounded-full mt-xxs" data-testid="address-default-badge">
                          Principal
                        </span>
                      }
                    </div>
                  </div>
                </div>

                <div class="text-body-sm text-body space-y-xxs flex-1">
                  <p class="text-ink font-medium" data-testid="address-card-street">{{ addr.street }}</p>
                  <p>{{ addr.city }}, {{ addr.state }} {{ addr.zipCode }}</p>
                  <p>{{ addr.country }}</p>
                  @if (addr.latitude && addr.longitude) {
                    <p class="text-caption text-mute flex items-center gap-xxs mt-xs">📍 Ubicación en mapa guardada</p>
                  }
                </div>

                <div class="flex items-center gap-sm pt-lg mt-lg border-t border-surface-pressed">
                  <button
                    type="button"
                    class="flex items-center gap-xs text-body-sm font-medium text-ink px-md py-sm rounded-full border border-surface-pressed hover:border-primary hover:text-primary transition"
                    (click)="openEdit(addr)"
                    data-testid="address-edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                    </svg>
                    Editar
                  </button>
                  <button
                    type="button"
                    class="flex items-center gap-xs text-body-sm font-medium text-red-600 px-md py-sm rounded-full border border-red-200 hover:border-red-500 transition"
                    (click)="requestDelete(addr)"
                    data-testid="address-delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                      <path d="M10 11v6M14 11v6"></path>
                    </svg>
                    Eliminar
                  </button>
                  @if (!addr.isDefault) {
                    <button
                      type="button"
                      class="ml-auto text-body-sm font-medium text-primary hover:underline"
                      (click)="setDefault(addr)"
                      data-testid="address-set-default"
                    >
                      Hacer principal
                    </button>
                  }
                </div>
              </article>
            }
          </div>
        }
      }

      <!-- Address form modal -->
      @if (formOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-lg" (click)="closeForm()" data-testid="address-form-modal">
          <div class="bg-canvas rounded-xl w-full max-w-[32rem] max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between px-2xl py-lg border-b border-surface-pressed sticky top-0 bg-canvas">
              <h2 class="text-body-lg font-bold">{{ editingId() ? 'Editar dirección' : 'Nueva dirección' }}</h2>
              <button type="button" class="icon-btn-circular" (click)="closeForm()" aria-label="Cerrar">✕</button>
            </div>

            <form class="p-2xl flex flex-col gap-lg" (ngSubmit)="save()" data-testid="address-form">
              <div>
                <label for="addr-label" class="form-label">Nombre de la dirección <span class="optional">(Opcional)</span></label>
                <input id="addr-label" type="text" class="form-input" placeholder="Casa, Trabajo, Mamá..."
                  [(ngModel)]="form.label" name="label" maxlength="30" data-testid="address-form-label" />
              </div>

              <div>
                <label for="addr-street" class="form-label">Calle y número <span class="required">*</span></label>
                <input id="addr-street" type="text" class="form-input" placeholder="Av. Principal 1234"
                  [class.input-error]="isInvalid('street')"
                  [(ngModel)]="form.street" name="street" data-testid="address-form-street" />
                @if (isInvalid('street')) {
                  <p class="form-error mt-xxs" data-testid="address-form-street-error">Completá la calle y número</p>
                }
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                <div>
                  <label for="addr-city" class="form-label">Ciudad <span class="required">*</span></label>
                  <input id="addr-city" type="text" class="form-input" placeholder="Guanare"
                    [class.input-error]="isInvalid('city')"
                    [(ngModel)]="form.city" name="city" data-testid="address-form-city" />
                  @if (isInvalid('city')) {
                    <p class="form-error mt-xxs" data-testid="address-form-city-error">Requerida</p>
                  }
                </div>
                <div>
                  <label for="addr-state" class="form-label">Estado <span class="required">*</span></label>
                  <input id="addr-state" type="text" class="form-input" placeholder="Portuguesa"
                    [class.input-error]="isInvalid('state')"
                    [(ngModel)]="form.state" name="state" data-testid="address-form-state" />
                  @if (isInvalid('state')) {
                    <p class="form-error mt-xxs" data-testid="address-form-state-error">Requerido</p>
                  }
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                <div>
                  <label for="addr-zip" class="form-label">Código postal <span class="required">*</span></label>
                  <input id="addr-zip" type="text" class="form-input" placeholder="3301"
                    [class.input-error]="isInvalid('zipCode')"
                    [(ngModel)]="form.zipCode" name="zipCode" data-testid="address-form-zip" />
                  @if (isInvalid('zipCode')) {
                    <p class="form-error mt-xxs" data-testid="address-form-zip-error">Requerido</p>
                  }
                </div>
                <div>
                  <label for="addr-country" class="form-label">País <span class="required">*</span></label>
                  <input id="addr-country" type="text" class="form-input" placeholder="Venezuela"
                    [class.input-error]="isInvalid('country')"
                    [(ngModel)]="form.country" name="country" data-testid="address-form-country" />
                  @if (isInvalid('country')) {
                    <p class="form-error mt-xxs" data-testid="address-form-country-error">Requerido</p>
                  }
                </div>
              </div>

              <div>
                <label class="form-label">Ubicación en mapa <span class="optional">(Opcional)</span></label>
                <button type="button"
                  class="w-full border-2 border-dashed border-surface-pressed rounded-xl py-lg text-body-sm-strong hover:border-primary hover:text-primary transition"
                  (click)="mapPicker.open()"
                  data-testid="address-form-map"
                >
                  @if (form.latitude && form.longitude) {
                    📍 Ubicación seleccionada — Tocar para cambiar
                  } @else {
                    🗺️ Abrir mapa para seleccionar ubicación
                  }
                </button>
                @if (form.latitude && form.longitude) {
                  <p class="text-caption text-mute mt-xxs">
                    Lat: {{ form.latitude!.toFixed(6) }}, Lng: {{ form.longitude!.toFixed(6) }}
                  </p>
                }
              </div>

              <div class="flex justify-end gap-md pt-lg border-t border-surface-pressed">
                <button type="button" class="btn-secondary" (click)="closeForm()" data-testid="address-form-cancel">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="saving()" data-testid="address-form-submit">
                  {{ saving() ? 'Guardando...' : (editingId() ? 'Guardar cambios' : 'Agregar dirección') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete confirmation modal -->
      @if (deletingId()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-lg" (click)="deletingId.set(null)" data-testid="address-delete-modal">
          <div class="bg-canvas rounded-xl w-full max-w-[26rem] p-2xl text-center" (click)="$event.stopPropagation()">
            <div class="w-14 h-14 rounded-full bg-red-50 grid place-items-center mx-auto mb-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
              </svg>
            </div>
            <h2 class="text-body-lg font-bold mb-xs">¿Eliminar dirección?</h2>
            <p class="text-body-sm text-body mb-xl">Esta acción no se puede deshacer.</p>
            <div class="flex gap-md">
              <button type="button" class="btn-secondary flex-1" (click)="deletingId.set(null)" data-testid="address-delete-cancel">Cancelar</button>
              <button type="button"
                class="flex-1 bg-red-600 text-white font-medium rounded-full py-md hover:opacity-90 transition"
                (click)="confirmDelete()"
                data-testid="address-delete-confirm"
              >Eliminar</button>
            </div>
          </div>
        </div>
      }

      <app-map-picker
        #mapPicker
        [branch]="branchService.selectedBranch()"
        [zones]="zones()"
        (locationSelected)="onLocationPicked($event)"
      />
    </section>
  `,
  styles: `
    .form-input.input-error,
    .form-input.input-error:focus {
      border-color: #dc2626;
    }
  `,
})
export class UserAddresses implements OnInit {
  private readonly addressesService = inject(AddressService);
  private readonly toast = inject(ToastService);
  protected readonly branchService = inject(BranchService);
  readonly auth = inject(AuthService);
  readonly authModal = inject(AuthModalService);

  readonly addresses = signal<Address[]>([]);
  readonly zones = signal<DeliveryZone[]>([]);

  private readonly zoneEffect = effect(() => {
    const branch = this.branchService.selectedBranch();
    if (!branch) {
      this.zones.set([]);
      return;
    }
    this.branchService.getZones(branch.id).subscribe((zones) => {
      this.zones.set(zones);
    });
  });
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly submitted = signal(false);

  readonly form = {
    label: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: environment.defaultCountry,
    latitude: null as number | null,
    longitude: null as number | null,
  };

  ngOnInit(): void {
    if (!this.auth.isAuthed()) {
      this.loading.set(false);
      return;
    }
    this.branchService.load();
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.addressesService.getMine().subscribe({
      next: (addrs) => {
        this.addresses.set(addrs);
        this.loading.set(false);
      },
      error: () => {
        this.addresses.set([]);
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.resetForm();
    this.editingId.set(null);
    this.submitted.set(false);
    this.formOpen.set(true);
  }

  openEdit(address: Address): void {
    this.editingId.set(address.id);
    this.submitted.set(false);
    this.form.label = address.label ?? '';
    this.form.street = address.street;
    this.form.city = address.city;
    this.form.state = address.state;
    this.form.zipCode = address.zipCode;
    this.form.country = address.country;
    this.form.latitude = address.latitude != null ? Number(address.latitude) : null;
    this.form.longitude = address.longitude != null ? Number(address.longitude) : null;
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
    this.submitted.set(false);
    this.resetForm();
  }

  private resetForm(): void {
    this.form.label = '';
    this.form.street = '';
    this.form.city = '';
    this.form.state = '';
    this.form.zipCode = '';
    this.form.country = 'Venezuela';
    this.form.latitude = null;
    this.form.longitude = null;
  }

  isInvalid(field: string): boolean {
    if (!this.submitted()) return false;
    return !String((this.form as Record<string, unknown>)[field] ?? '').trim();
  }

  save(): void {
    this.submitted.set(true);
    if (
      !this.form.street.trim() ||
      !this.form.city.trim() ||
      !this.form.state.trim() ||
      !this.form.zipCode.trim() ||
      !this.form.country.trim()
    ) {
      return;
    }

    this.saving.set(true);
    const payload: AddressPayload = {
      street: this.form.street.trim(),
      city: this.form.city.trim(),
      state: this.form.state.trim(),
      zipCode: this.form.zipCode.trim(),
      country: this.form.country.trim(),
      label: this.form.label.trim() || null,
      latitude: this.form.latitude,
      longitude: this.form.longitude,
    };

    const id = this.editingId();
    const request = id
      ? this.addressesService.update(id, payload)
      : this.addressesService.create(payload);

    request.subscribe({
      next: (address) => {
        this.saving.set(false);
        if (address?.id) {
          this.toast.success(id ? 'Dirección actualizada' : 'Dirección agregada');
          this.closeForm();
          this.load();
        } else {
          this.toast.error('No se pudo guardar la dirección');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(
          err?.error?.message || 'No se pudo guardar la dirección',
        );
      },
    });
  }

  requestDelete(address: Address): void {
    this.deletingId.set(address.id);
  }

  confirmDelete(): void {
    const id = this.deletingId();
    if (!id) return;
    this.addressesService.remove(id).subscribe({
      next: () => {
        this.addresses.update((list) => list.filter((a) => a.id !== id));
        this.deletingId.set(null);
        this.toast.success('Dirección eliminada');
      },
      error: () => this.toast.error('No se pudo eliminar la dirección'),
    });
  }

  setDefault(address: Address): void {
    if (address.isDefault) return;
    const updates = this.addresses().map((a) =>
      this.addressesService.update(a.id, { isDefault: a.id === address.id }),
    );
    forkJoin(updates).subscribe({
      next: () => {
        this.toast.success('Dirección principal actualizada');
        this.load();
      },
    });
  }

  onLocationPicked(coords: { lat: number; lng: number }): void {
    this.form.latitude = coords.lat;
    this.form.longitude = coords.lng;
  }
}
