import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  Address,
  AddressPayload,
  AddressService,
} from '../../core/services/address.service';
import { BranchService, DeliveryZone } from '../../core/services/branch.service';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { SiteSettingsService } from '../../core/services/site-settings.service';
import { UploadService } from '../../core/services/upload.service';
import { environment } from '../../../environments/environment';

export type PaymentMethod = 'pago_movil' | 'zelle' | 'cash';
export type CheckoutStep = 'shipping' | 'payment' | 'review';

const STEP_ORDER: CheckoutStep[] = ['shipping', 'payment', 'review'];

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pago_movil: 'Pago Móvil',
  zelle: 'Zelle',
  cash: 'Efectivo',
};

export interface CheckoutStepInfo {
  id: CheckoutStep;
  label: string;
  hint: string;
  index: number;
  active: boolean;
  completed: boolean;
  summary: string;
}

@Injectable()
export class CheckoutStore {
  private readonly router = inject(Router);
  private readonly addressService = inject(AddressService);
  private readonly orderService = inject(OrderService);
  private readonly uploadService = inject(UploadService);
  private readonly settingsService = inject(SiteSettingsService);
  readonly branchService = inject(BranchService);
  readonly cart = inject(CartService);

  readonly addresses = signal<Address[]>([]);
  readonly zones = signal<DeliveryZone[]>([]);
  readonly selectedAddressId = signal('');
  readonly coverageError = signal('');

  readonly showAddressForm = signal(false);
  readonly savingAddress = signal(false);
  readonly attemptedAddressSave = signal(false);

  readonly paymentMethod = signal<PaymentMethod>('pago_movil');
  readonly paymentReference = signal('');
  readonly receiptFile = signal<File | null>(null);
  readonly receiptPreview = signal<string | null>(null);
  readonly copied = signal<'pago_movil' | 'zelle' | ''>('');

  readonly placing = signal(false);
  readonly error = signal('');

  readonly step = signal<CheckoutStep>('shipping');
  readonly direction = signal<'forward' | 'back'>('forward');
  readonly attemptedShipping = signal(false);
  readonly attemptedPayment = signal(false);

  readonly selectedBranch = this.branchService.selectedBranch;
  readonly settings = this.settingsService.settings;

  readonly branchAddresses = computed(() => {
    const branchId = this.branchService.selectedBranch()?.id;
    if (!branchId) return this.addresses();
    return this.addresses().filter(
      (address) => !address.branchId || address.branchId === branchId,
    );
  });

  readonly selectedAddress = computed(
    () =>
      this.addresses().find((address) => address.id === this.selectedAddressId()) ??
      null,
  );

  readonly hasItems = computed(() => this.cart.items().length > 0);

  readonly requiresPaymentProof = computed(
    () => this.paymentMethod() !== 'cash',
  );

  readonly paymentLabel = computed(() => PAYMENT_LABELS[this.paymentMethod()]);

  readonly shippingComplete = computed(
    () =>
      this.hasItems() &&
      this.selectedAddressId().length > 0 &&
      this.coverageError().length === 0,
  );

  readonly paymentComplete = computed(
    () =>
      !this.requiresPaymentProof() ||
      (this.paymentReference().trim().length > 0 && this.receiptFile() !== null),
  );

  readonly canContinue = computed(() =>
    this.step() === 'payment' ? this.paymentComplete() : this.shippingComplete(),
  );

  readonly canPlaceOrder = computed(
    () => this.shippingComplete() && this.paymentComplete(),
  );

  readonly stepIndex = computed(() => STEP_ORDER.indexOf(this.step()));

  readonly progress = computed(
    () => ((this.stepIndex() + 1) / STEP_ORDER.length) * 100,
  );

  readonly activeStep = computed(
    () => this.steps().find((step) => step.active) ?? this.steps()[0],
  );

  readonly steps = computed<CheckoutStepInfo[]>(() => {
    const current = this.step();
    const address = this.selectedAddress();
    const addressSummary = address
      ? address.label || address.street
      : 'Sin dirección';
    const paymentSummary = this.requiresPaymentProof()
      ? `${PAYMENT_LABELS[this.paymentMethod()]} · comprobante`
      : PAYMENT_LABELS[this.paymentMethod()];

    return [
      {
        id: 'shipping',
        label: 'Envío',
        hint: 'Dirección de entrega',
        index: 0,
        active: current === 'shipping',
        completed: this.shippingComplete() && current !== 'shipping',
        summary: addressSummary,
      },
      {
        id: 'payment',
        label: 'Pago',
        hint: 'Método de pago',
        index: 1,
        active: current === 'payment',
        completed: this.paymentComplete() && current === 'review',
        summary: paymentSummary,
      },
      {
        id: 'review',
        label: 'Revisión',
        hint: 'Confirmar pedido',
        index: 2,
        active: current === 'review',
        completed: false,
        summary: 'Revisá y confirmá',
      },
    ];
  });

  readonly blockingMessage = computed(() => {
    if (this.step() === 'shipping') {
      if (!this.hasItems()) return 'Tu carrito está vacío.';
      if (this.coverageError()) return this.coverageError();
      if (!this.selectedAddressId()) return 'Agregá una dirección para continuar.';
    }
    if (this.step() === 'payment' && !this.paymentComplete()) {
      return 'Completá la referencia y subí el comprobante para continuar.';
    }
    return '';
  });

  readonly addressForm = {
    street: '',
    city: environment.defaultCity,
    state: environment.defaultState,
    zipCode: environment.defaultZipCode,
    country: environment.defaultCountry,
    label: '',
    reference: '',
    latitude: null as number | null,
    longitude: null as number | null,
  };

  constructor() {
    effect(() => {
      const branch = this.branchService.selectedBranch();
      if (!branch) {
        this.zones.set([]);
        return;
      }
      this.branchService.getZones(branch.id).subscribe((zones) => {
        this.zones.set(zones);
      });
    });

    effect(() => {
      const options = this.branchAddresses();
      const current = this.selectedAddressId();
      if (options.length === 0) {
        if (current) this.selectedAddressId.set('');
        return;
      }
      if (!options.some((address) => address.id === current)) {
        const preferred =
          options.find((address) => address.isDefault) ?? options[0];
        this.selectedAddressId.set(preferred.id);
      }
    });

    effect(() => {
      if (this.step() !== 'shipping' && !this.shippingComplete()) {
        this.direction.set('back');
        this.step.set('shipping');
      }
    });
  }

  init(): void {
    this.settingsService.load();
    this.branchService.load();
    this.loadAddresses();
    this.cart.validateStock().subscribe();
  }

  selectAddress(id: string): void {
    this.selectedAddressId.set(id);
    this.coverageError.set('');
  }

  goNext(): void {
    if (this.step() === 'shipping') {
      this.attemptedShipping.set(true);
      if (!this.shippingComplete()) return;
      this.direction.set('forward');
      this.step.set('payment');
      return;
    }

    if (this.step() === 'payment') {
      this.attemptedPayment.set(true);
      if (!this.paymentComplete()) return;
      this.direction.set('forward');
      this.step.set('review');
    }
  }

  goBack(): void {
    const index = this.stepIndex();
    if (index === 0) return;
    this.direction.set('back');
    this.step.set(STEP_ORDER[index - 1]);
  }

  goTo(target: CheckoutStep): void {
    const targetIndex = STEP_ORDER.indexOf(target);
    if (targetIndex < 0 || targetIndex >= this.stepIndex()) return;
    this.direction.set('back');
    this.step.set(target);
  }

  private loadAddresses(): void {
    this.addressService.getMine().subscribe({
      next: (addrs) => {
        this.addresses.set(addrs);
        const defaultAddr = addrs.find((address) => address.isDefault);
        if (defaultAddr) this.selectedAddressId.set(defaultAddr.id);
        else if (addrs.length > 0) this.selectedAddressId.set(addrs[0].id);
      },
    });
  }

  saveAddress(): void {
    this.attemptedAddressSave.set(true);
    if (
      !this.addressForm.street.trim() ||
      !this.addressForm.city.trim() ||
      !this.addressForm.state.trim() ||
      !this.addressForm.zipCode.trim() ||
      !this.addressForm.country.trim()
    ) {
      return;
    }

    this.savingAddress.set(true);
    const payload: AddressPayload = {
      street: this.addressForm.street,
      city: this.addressForm.city,
      state: this.addressForm.state,
      zipCode: this.addressForm.zipCode,
      country: this.addressForm.country,
      label: this.addressForm.label || null,
      latitude: this.addressForm.latitude,
      longitude: this.addressForm.longitude,
    };

    this.addressService.create(payload).subscribe({
      next: (addr) => {
        this.addresses.update((list) => [...list, addr]);
        this.selectedAddressId.set(addr.id);
        this.coverageError.set('');
        this.error.set('');
        if (addr.branchId) {
          const branch = this.branchService
            .branches()
            .find((item) => item.id === addr.branchId);
          if (branch) this.branchService.setSelected(branch);
        }
        this.showAddressForm.set(false);
        this.attemptedAddressSave.set(false);
        this.savingAddress.set(false);
        this.resetAddressForm();
        if (this.shippingComplete()) {
          this.direction.set('forward');
          this.step.set('payment');
        }
      },
      error: (err) => {
        this.savingAddress.set(false);
        const message =
          err?.error?.message || 'No se pudo guardar la dirección';
        this.coverageError.set(message);
        this.error.set(message);
      },
    });
  }

  addressFieldEmpty(field: string): boolean {
    return (
      this.attemptedAddressSave() &&
      !String((this.addressForm as Record<string, unknown>)[field] ?? '').trim()
    );
  }

  private resetAddressForm(): void {
    this.addressForm.street = '';
    this.addressForm.label = '';
    this.addressForm.reference = '';
    this.addressForm.latitude = null;
    this.addressForm.longitude = null;
  }

  onLocationPicked(coords: { lat: number; lng: number }): void {
    this.addressForm.latitude = coords.lat;
    this.addressForm.longitude = coords.lng;
    this.coverageError.set('');
  }

  onReceiptSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.error.set('El comprobante debe ser una imagen (JPG, PNG, WEBP o GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.error.set('La imagen no puede superar 5MB');
      return;
    }

    this.error.set('');
    this.revokeReceiptPreview();
    this.receiptFile.set(file);
    this.receiptPreview.set(URL.createObjectURL(file));
  }

  private revokeReceiptPreview(): void {
    const preview = this.receiptPreview();
    if (preview) URL.revokeObjectURL(preview);
  }

  removeReceipt(): void {
    this.revokeReceiptPreview();
    this.receiptFile.set(null);
    this.receiptPreview.set(null);
    this.error.set('');
  }

  copyPagoMovil(): void {
    const pm = this.settings().paymentInfo?.pago_movil;
    if (!pm) return;
    const text = `${pm.bank}\n${pm.idDocument}\n${pm.phone}`;
    void navigator.clipboard.writeText(text).then(() => {
      this.copied.set('pago_movil');
      setTimeout(() => this.copied.set(''), 2000);
    });
  }

  copyZelle(): void {
    const zelle = this.settings().paymentInfo?.zelle;
    if (!zelle) return;
    void navigator.clipboard.writeText(zelle.email).then(() => {
      this.copied.set('zelle');
      setTimeout(() => this.copied.set(''), 2000);
    });
  }

  onPlaceOrder(): void {
    if (!this.canPlaceOrder() || this.cart.validatingStock()) return;
    this.error.set('');
    this.cart.validatingStock.set(true);
    this.cart.validateStock().subscribe({
      next: (issues) => {
        this.cart.validatingStock.set(false);
        if (issues.length > 0) return;
        this.placeOrder();
      },
      error: () => this.cart.validatingStock.set(false),
    });
  }

  private placeOrder(): void {
    this.placing.set(true);
    this.error.set('');

    const file = this.receiptFile();
    if (file) {
      this.uploadService.uploadImage('receipts', file).subscribe({
        next: (res) => this.createOrder(res.url),
        error: (err) => {
          this.error.set(
            err.error?.message || 'No se pudo subir el comprobante',
          );
          this.placing.set(false);
        },
      });
      return;
    }

    this.createOrder();
  }

  private createOrder(receiptUrl?: string): void {
    this.orderService
      .create({
        shippingAddressId: this.selectedAddressId(),
        branchId: this.branchService.getSelectedId() ?? undefined,
        paymentMethod: this.paymentMethod(),
        paymentReference: this.paymentReference().trim() || undefined,
        receipt: receiptUrl,
      })
      .subscribe({
        next: (order) => {
          this.placing.set(false);
          if (order?.id) {
            this.cart.clear();
            void this.router.navigate(['/order-completed', order.id]);
          } else {
            this.error.set('Error al procesar el pedido');
          }
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Error al procesar el pedido');
          this.placing.set(false);
        },
      });
  }
}
