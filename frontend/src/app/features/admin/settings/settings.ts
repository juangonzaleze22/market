import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminService, SiteSettings } from '../../../core/services/admin.service';
import { SiteSettingsService } from '../../../core/services/site-settings.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  DEFAULT_SITE_THEME,
  SiteTheme,
  SiteThemeBranding,
  SiteThemeColors,
  normalizeTheme,
} from '../../../core/models/site-theme';
import { contrastRatio, isValidHex } from '../../../core/utils/color.util';

const ELECTRO_PRESET: SiteThemeColors = {
  primary: '#FFD200',
  onPrimary: '#1c1c1c',
  brand: '#ffffff',
  onBrand: '#1c1c1c',
  accent: '#FFD200',
  onAccent: '#1c1c1c',
  link: '#1C8057',
};

@Component({
  selector: 'app-admin-settings',
  imports: [FormsModule],
  template: `
    <div data-testid="admin-settings">
      <div class="flex items-center justify-between mb-2xl">
        <h1 class="text-body-2xl font-bold" data-testid="settings-title">Configuración del Sitio</h1>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-4xl">
          <div class="w-8 h-8 border-2 border-surface-pressed border-t-primary rounded-full animate-spin"></div>
        </div>
      } @else {
        <div class="settings-grid">
          <!-- Top Banner Section -->
          <div class="settings-section">
            <h2 class="settings-section-title">Barra Superior (Top Banner)</h2>
            <p class="settings-section-desc">Configura el mensaje promocional y contacto que se muestra en la parte superior del sitio.</p>

            <div class="settings-fields">
              <div>
                <label class="settings-label" for="topBannerText">Mensaje promocional</label>
                <input id="topBannerText" type="text" [(ngModel)]="form().topBannerText"
                  class="settings-input" placeholder="Ej: Regístrate y obtén 25% OFF..."
                  data-testid="settings-banner-text" />
              </div>
              <div>
                <label class="settings-label" for="topBannerPhone">Teléfono de contacto</label>
                <input id="topBannerPhone" type="text" [(ngModel)]="form().topBannerPhone"
                  class="settings-input" placeholder="Ej: +123-456-789"
                  data-testid="settings-banner-phone" />
              </div>
              <div class="grid grid-cols-2 gap-lg">
                <div>
                  <label class="settings-label" for="topBannerCtaText">Texto del botón CTA</label>
                  <input id="topBannerCtaText" type="text" [(ngModel)]="form().topBannerCtaText"
                    class="settings-input" placeholder="Ej: Regístrate ahora"
                    data-testid="settings-banner-cta-text" />
                </div>
                <div>
                  <label class="settings-label" for="topBannerCtaLink">URL del botón CTA</label>
                  <input id="topBannerCtaLink" type="text" [(ngModel)]="form().topBannerCtaLink"
                    class="settings-input" placeholder="Ej: /register"
                    data-testid="settings-banner-cta-link" />
                </div>
              </div>
            </div>
          </div>

          <!-- Delivery Section -->
          <div class="settings-section">
            <h2 class="settings-section-title">Información de Entrega</h2>
            <p class="settings-section-desc">Horario de entrega que se muestra en el navbar y header.</p>

            <div class="settings-fields">
              <div>
                <label class="settings-label" for="deliveryHours">Horario de entrega</label>
                <input id="deliveryHours" type="text" [(ngModel)]="form().deliveryHours"
                  class="settings-input" placeholder="Ej: Entregamos todos los días de 7:00 a 22:00"
                  data-testid="settings-delivery-hours" />
              </div>
            </div>
          </div>

          <!-- Secondary Links Section -->
          <div class="settings-section">
            <h2 class="settings-section-title">Links Secundarios</h2>
            <p class="settings-section-desc">Links que aparecen en la barra superior del header (Sobre nosotros, Mi cuenta, etc).</p>

            <div class="settings-fields">
              @for (link of secondaryLinks(); track $index; let i = $index) {
                <div class="settings-link-row">
                  <div class="flex-1">
                    <label class="settings-label">Texto</label>
                    <input type="text" [ngModel]="link.label" (ngModelChange)="updateSecondaryLink(i, 'label', $event)"
                      class="settings-input" placeholder="Ej: Sobre nosotros" />
                  </div>
                  <div class="flex-1">
                    <label class="settings-label">URL</label>
                    <input type="text" [ngModel]="link.url" (ngModelChange)="updateSecondaryLink(i, 'url', $event)"
                      class="settings-input" placeholder="Ej: /about" />
                  </div>
                  <button type="button" class="settings-remove-btn" (click)="removeSecondaryLink(i)" [attr.data-testid]="'remove-secondary-' + i">
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/></svg>
                  </button>
                </div>
              }
              <button type="button" class="settings-add-btn" (click)="addSecondaryLink()" data-testid="add-secondary-link">
                + Agregar link
              </button>
            </div>
          </div>

          <!-- Social Links Section -->
          <div class="settings-section">
            <h2 class="settings-section-title">Redes Sociales</h2>
            <p class="settings-section-desc">Redes sociales que se muestran en el top banner.</p>

            <div class="settings-fields">
              @for (link of socialLinks(); track $index; let i = $index) {
                <div class="settings-link-row">
                  <div class="flex-1">
                    <label class="settings-label">Plataforma</label>
                    <select [ngModel]="link.platform" (ngModelChange)="updateSocialLink(i, 'platform', $event)" class="settings-input">
                      <option value="facebook">Facebook</option>
                      <option value="twitter">Twitter</option>
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                  <div class="flex-1">
                    <label class="settings-label">URL</label>
                    <input type="url" [ngModel]="link.url" (ngModelChange)="updateSocialLink(i, 'url', $event)"
                      class="settings-input" placeholder="Ej: https://facebook.com/tu-pagina" />
                  </div>
                  <button type="button" class="settings-remove-btn" (click)="removeSocialLink(i)" [attr.data-testid]="'remove-social-' + i">
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/></svg>
                  </button>
                </div>
              }
              <button type="button" class="settings-add-btn" (click)="addSocialLink()" data-testid="add-social-link">
                + Agregar red social
              </button>
            </div>
          </div>

          <!-- Promo Section -->
          <div class="settings-section">
            <h2 class="settings-section-title">Mensaje Promocional</h2>
            <p class="settings-section-desc">Mensaje que se puede mostrar en diferentes partes del sitio.</p>

            <div class="settings-fields">
              <div>
                <label class="settings-label" for="promoMessage">Mensaje de promoción</label>
                <input id="promoMessage" type="text" [(ngModel)]="form().promoMessage"
                  class="settings-input" placeholder="Ej: Envío gratis en pedidos mayores a $50"
                  data-testid="settings-promo-message" />
              </div>
            </div>
          </div>

          <!-- Payment Info Section -->
          <div class="settings-section">
            <h2 class="settings-section-title">Información de Métodos de Pago</h2>
            <p class="settings-section-desc">Datos bancarios que se muestran al cliente al seleccionar un método de pago en el checkout.</p>

            <div class="settings-fields">
              <!-- Pago Móvil -->
              <div class="settings-payment-group">
                <h3 class="settings-payment-title">Pago Móvil</h3>
                <div class="grid grid-cols-2 gap-lg">
                  <div>
                    <label class="settings-label" for="pmBank">Banco</label>
                    <input id="pmBank" type="text" [(ngModel)]="paymentInfoForm.pago_movil.bank"
                      class="settings-input" placeholder="Ej: Banco de Venezuela"
                      data-testid="settings-pm-bank" />
                  </div>
                  <div>
                    <label class="settings-label" for="pmPhone">Teléfono</label>
                    <input id="pmPhone" type="text" [(ngModel)]="paymentInfoForm.pago_movil.phone"
                      class="settings-input" placeholder="Ej: 0412-1234567"
                      data-testid="settings-pm-phone" />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-lg">
                  <div>
                    <label class="settings-label" for="pmHolder">Titular de la cuenta</label>
                    <input id="pmHolder" type="text" [(ngModel)]="paymentInfoForm.pago_movil.holderName"
                      class="settings-input" placeholder="Ej: Juan Pérez"
                      data-testid="settings-pm-holder" />
                  </div>
                  <div>
                    <label class="settings-label" for="pmId">Cédula / RIF</label>
                    <input id="pmId" type="text" [(ngModel)]="paymentInfoForm.pago_movil.idDocument"
                      class="settings-input" placeholder="Ej: V-12345678"
                      data-testid="settings-pm-id" />
                  </div>
                </div>
              </div>

              <!-- Zelle -->
              <div class="settings-payment-group">
                <h3 class="settings-payment-title">Zelle</h3>
                <div class="grid grid-cols-2 gap-lg">
                  <div>
                    <label class="settings-label" for="zelleEmail">Email de Zelle</label>
                    <input id="zelleEmail" type="email" [(ngModel)]="paymentInfoForm.zelle.email"
                      class="settings-input" placeholder="Ej: correo@ejemplo.com"
                      data-testid="settings-zelle-email" />
                  </div>
                  <div>
                    <label class="settings-label" for="zelleHolder">Nombre del titular</label>
                    <input id="zelleHolder" type="text" [(ngModel)]="paymentInfoForm.zelle.holderName"
                      class="settings-input" placeholder="Ej: Juan Pérez"
                      data-testid="settings-zelle-holder" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Appearance Section -->
          <div class="settings-section" data-testid="settings-theme">
            <h2 class="settings-section-title">Apariencia y Marca</h2>
            <p class="settings-section-desc">Personaliza los colores, el logo y los iconos del sitio. Los cambios se aplican al guardar.</p>

            <div class="settings-fields">
              <div>
                <label class="settings-label" for="brandName">Nombre de la marca</label>
                <input id="brandName" type="text" [ngModel]="themeForm().branding.brandName"
                  (ngModelChange)="setBrandName($event)" class="settings-input"
                  placeholder="Ej: Tu Mercadito" data-testid="settings-brand-name" />
              </div>

              <div class="settings-color-grid">
                @for (field of colorFields; track field.key) {
                  <div class="settings-color-field">
                    <label class="settings-label">{{ field.label }}</label>
                    <div class="settings-color-row">
                      <input type="color" class="settings-color-swatch"
                        [ngModel]="themeForm().colors[field.key]"
                        (ngModelChange)="setColor(field.key, $event)"
                        [attr.data-testid]="'settings-color-' + field.key" />
                      <input type="text" class="settings-input"
                        [ngModel]="themeForm().colors[field.key]"
                        (ngModelChange)="setColor(field.key, $event)"
                        [attr.data-testid]="'settings-hex-' + field.key" />
                    </div>
                  </div>
                }
              </div>

              @if (contrastIssues().length > 0) {
                <div class="settings-warning" data-testid="settings-contrast-warning">
                  <p class="settings-warning-title">Aviso de contraste</p>
                  <ul class="settings-warning-list">
                    @for (issue of contrastIssues(); track issue) {
                      <li>{{ issue }}</li>
                    }
                  </ul>
                </div>
              }

              <p class="settings-color-hint">
                <strong>Color de marca</strong> pinta el header, footer y panel de administración.
                <strong>Color primario</strong> se usa en botones, acciones y el navbar. Así puedes
                tener un header blanco con el navbar y los botones en otro color.
              </p>

              @for (field of brandingFields; track field.key) {
                <div class="settings-brand-field">
                  <label class="settings-label">{{ field.label }}</label>
                  <p class="settings-brand-hint">{{ field.hint }}</p>
                  <div class="settings-brand-row">
                    <div class="settings-brand-preview">
                      <img [src]="themeForm().branding[field.key]" alt="" />
                    </div>
                    <input type="text" class="settings-input"
                      [ngModel]="themeForm().branding[field.key]"
                      (ngModelChange)="setBrandingUrl(field.key, $event)"
                      [attr.data-testid]="'settings-' + field.key" />
                    <label class="settings-upload-btn">
                      @if (uploading() === field.key) {
                        <span class="btn-spinner"></span>
                      } @else {
                        Subir
                      }
                      <input type="file" accept="image/*" class="hidden"
                        (change)="onBrandingFile(field.key, $event)" />
                    </label>
                  </div>
                </div>
              }

              <div class="flex justify-end gap-md flex-wrap">
                <button type="button" class="settings-add-btn" (click)="applyElectroPreset()" data-testid="settings-theme-preset-electro">
                  Aplicar estilo Electro
                </button>
                <button type="button" class="settings-add-btn" (click)="resetTheme()" data-testid="settings-theme-reset">
                  Restaurar apariencia por defecto
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Save button -->
        <div class="flex justify-end mt-2xl">
          <button type="button" class="btn-primary" (click)="save()" [disabled]="saving()" data-testid="save-settings">
            @if (saving()) {
              <span class="inline-flex items-center gap-sm"><span class="btn-spinner"></span>Guardando...</span>
            } @else {
              Guardar configuración
            }
          </button>
        </div>

        @if (success()) {
          <p class="mt-lg form-error text-green-700 font-medium" data-testid="settings-success">Configuración guardada correctamente.</p>
        }
        @if (error()) {
          <p class="mt-lg form-error" data-testid="settings-error">{{ error() }}</p>
        }
      }
    </div>
  `,
  styles: `
    .settings-grid {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xl);
    }

    .settings-section {
      background-color: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      padding: var(--spacing-2xl);
    }

    .settings-section-title {
      font-size: var(--text-body-lg);
      font-weight: 700;
      color: var(--color-ink);
      margin: 0 0 var(--spacing-xs) 0;
    }

    .settings-section-desc {
      font-size: var(--text-body-sm);
      color: var(--color-body);
      margin: 0 0 var(--spacing-xl) 0;
    }

    .settings-fields {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .settings-label {
      display: block;
      font-size: var(--text-body-md);
      line-height: var(--text-body-md--line-height);
      font-weight: 500;
      color: var(--color-body);
      margin-bottom: var(--spacing-xxs);
    }

    .settings-input {
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      font-size: var(--text-body-md);
      line-height: var(--text-body-md--line-height);
      color: var(--color-ink);
      background-color: var(--color-canvas);
      outline: none;
      transition: border-color 0.2s ease;
    }

    .settings-input::placeholder {
      color: var(--color-mute);
    }

    .settings-input:focus {
      border-color: var(--color-primary);
    }

    .settings-link-row {
      display: flex;
      align-items: flex-end;
      gap: var(--spacing-md);
    }

    .settings-remove-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-surface-pressed);
      background-color: var(--color-canvas);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--color-body);
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .settings-remove-btn:hover {
      border-color: #dc2626;
      color: #dc2626;
      background-color: #fef2f2;
    }

    .settings-add-btn {
      padding: 8px 16px;
      border: 1px dashed var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      background: none;
      color: var(--color-link);
      font-size: var(--text-body-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .settings-add-btn:hover {
      border-color: var(--color-primary);
      background-color: var(--color-canvas-soft);
    }

    .settings-payment-group {
      background-color: var(--color-canvas-soft);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .settings-payment-title {
      font-size: var(--text-body-md);
      font-weight: 600;
      color: var(--color-ink);
      margin: 0;
    }

    .settings-color-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
    }

    @media (max-width: 640px) {
      .settings-color-grid {
        grid-template-columns: 1fr;
      }
    }

    .settings-color-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .settings-color-swatch {
      width: 44px;
      height: 40px;
      padding: 0;
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      background: none;
      cursor: pointer;
      flex-shrink: 0;
    }

    .settings-warning {
      padding: var(--spacing-md) var(--spacing-lg);
      border: 1px solid #fecaca;
      border-radius: var(--radius-lg);
      background-color: #fef2f2;
      color: #991b1b;
    }

    .settings-color-hint {
      margin: 0;
      font-size: var(--text-body-xs);
      line-height: var(--text-body-xs--line-height);
      color: var(--color-body);
    }

    .settings-color-hint strong {
      color: var(--color-ink);
    }

    .settings-warning-title {
      margin: 0 0 var(--spacing-xxs);
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
    }

    .settings-warning-list {
      margin: 0;
      padding-left: var(--spacing-lg);
      font-size: var(--text-body-xs);
      line-height: var(--text-body-xs--line-height);
    }

    .settings-brand-field {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xxs);
    }

    .settings-brand-hint {
      margin: 0;
      font-size: var(--text-body-xs);
      line-height: var(--text-body-xs--line-height);
      color: var(--color-body);
    }

    .settings-brand-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .settings-brand-preview {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-surface-pressed);
      background-color: var(--color-canvas-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .settings-brand-preview img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .settings-upload-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 88px;
      padding: var(--spacing-sm) var(--spacing-lg);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-pill);
      background-color: var(--color-canvas);
      color: var(--color-ink);
      font-size: var(--text-body-sm-strong);
      line-height: var(--text-body-sm-strong--line-height);
      font-weight: 500;
      cursor: pointer;
      flex-shrink: 0;
      transition: background-color 0.2s ease;
    }

    .settings-upload-btn:hover {
      background-color: var(--color-canvas-soft);
    }
  `,
})
export class AdminSettings implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly siteSettings = inject(SiteSettingsService);

  protected readonly themeForm = signal<SiteTheme>(normalizeTheme(DEFAULT_SITE_THEME));
  protected readonly uploading = signal<keyof SiteThemeBranding | null>(null);

  protected readonly colorFields: { key: keyof SiteThemeColors; label: string }[] = [
    { key: 'primary', label: 'Color primario (botones, acciones y navbar)' },
    { key: 'onPrimary', label: 'Texto sobre primario' },
    { key: 'brand', label: 'Color de marca (header y footer)' },
    { key: 'onBrand', label: 'Texto sobre marca' },
    { key: 'accent', label: 'Color de acento' },
    { key: 'onAccent', label: 'Texto sobre acento' },
    { key: 'link', label: 'Color de enlaces' },
  ];

  protected readonly brandingFields: {
    key: keyof SiteThemeBranding;
    label: string;
    hint: string;
  }[] = [
    {
      key: 'logoUrl',
      label: 'Logo principal',
      hint: 'Versión oscura del logo. Se usa en fondos claros y cuando el color de marca es claro (navbar blanco).',
    },
    {
      key: 'logoDarkUrl',
      label: 'Logo para navbar',
      hint: 'Versión clara (blanca) del logo. Se usa cuando el color de marca es oscuro.',
    },
    {
      key: 'faviconUrl',
      label: 'Favicon',
      hint: 'Icono de la pestaña del navegador (PNG, WebP o ICO).',
    },
    {
      key: 'pwaIconUrl',
      label: 'Icono PWA',
      hint: 'Icono de instalación de la app. Idealmente cuadrado de 512×512.',
    },
  ];

  protected readonly contrastIssues = computed<string[]>(() => {
    const colors = this.themeForm().colors;
    const issues: string[] = [];
    const check = (label: string, background: string, foreground: string) => {
      if (!isValidHex(background) || !isValidHex(foreground)) {
        return;
      }
      const ratio = contrastRatio(background, foreground);
      if (ratio < 4.5) {
        issues.push(`${label}: ${ratio.toFixed(2)}:1 (mínimo recomendado 4.5:1)`);
      }
    };
    check('Texto sobre el color primario', colors.primary, colors.onPrimary);
    check('Texto sobre el color de marca', colors.brand, colors.onBrand);
    check('Texto sobre el color de acento', colors.accent, colors.onAccent);
    check('Enlaces sobre el fondo', '#ffffff', colors.link);
    return issues;
  });

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly success = signal(false);
  protected readonly error = signal('');

  protected readonly form = signal<Partial<SiteSettings>>({});
  protected readonly secondaryLinks = signal<{ label: string; url: string }[]>([]);
  protected readonly socialLinks = signal<{ platform: string; url: string }[]>([]);

  protected readonly paymentInfoForm = {
    pago_movil: { bank: '', phone: '', holderName: '', idDocument: '' },
    zelle: { email: '', holderName: '' },
  };

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.loading.set(true);
    this.adminService.getSettings().subscribe({
      next: (settings) => {
        this.form.set(settings);
        this.themeForm.set(normalizeTheme(settings.theme));
        this.secondaryLinks.set(settings.secondaryLinks ? [...settings.secondaryLinks] : []);
        this.socialLinks.set(settings.socialLinks ? [...settings.socialLinks] : []);
        if (settings.paymentInfo?.pago_movil) {
          this.paymentInfoForm.pago_movil = { ...settings.paymentInfo.pago_movil };
        }
        if (settings.paymentInfo?.zelle) {
          this.paymentInfoForm.zelle = { ...settings.paymentInfo.zelle };
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.form.set({
          topBannerText: '',
          topBannerPhone: '',
          topBannerCtaText: '',
          topBannerCtaLink: '',
          deliveryHours: '',
          promoMessage: '',
        });
      },
    });
  }

  protected addSecondaryLink(): void {
    this.secondaryLinks.update((links) => [...links, { label: '', url: '' }]);
  }

  protected removeSecondaryLink(index: number): void {
    this.secondaryLinks.update((links) => links.filter((_, i) => i !== index));
  }

  protected updateSecondaryLink(index: number, field: 'label' | 'url', value: string): void {
    this.secondaryLinks.update((links) =>
      links.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    );
  }

  protected addSocialLink(): void {
    this.socialLinks.update((links) => [...links, { platform: 'facebook', url: '' }]);
  }

  protected removeSocialLink(index: number): void {
    this.socialLinks.update((links) => links.filter((_, i) => i !== index));
  }

  protected updateSocialLink(index: number, field: 'platform' | 'url', value: string): void {
    this.socialLinks.update((links) =>
      links.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    );
  }

  protected setBrandName(value: string): void {
    this.themeForm.update((theme) => ({
      ...theme,
      branding: { ...theme.branding, brandName: value },
    }));
    this.previewTheme();
  }

  protected setColor(key: keyof SiteThemeColors, value: string): void {
    this.themeForm.update((theme) => ({
      ...theme,
      colors: { ...theme.colors, [key]: value },
    }));
    this.previewTheme();
  }

  protected setBrandingUrl(key: keyof SiteThemeBranding, value: string): void {
    this.themeForm.update((theme) => ({
      ...theme,
      branding: { ...theme.branding, [key]: value },
    }));
    this.previewTheme();
  }

  protected resetTheme(): void {
    this.themeForm.set(normalizeTheme(DEFAULT_SITE_THEME));
    this.previewTheme();
  }

  protected applyElectroPreset(): void {
    this.themeForm.update((theme) => ({
      ...theme,
      colors: { ...ELECTRO_PRESET },
    }));
    this.previewTheme();
  }

  protected onBrandingFile(key: keyof SiteThemeBranding, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.uploading.set(key);
    this.adminService
      .uploadImage('branding', file)
      .pipe(
        finalize(() => {
          this.uploading.set(null);
          input.value = '';
        }),
      )
      .subscribe({
        next: (response) => {
          this.setBrandingUrl(key, response.url);
          this.toast.success('Imagen actualizada');
        },
        error: () => this.toast.error('No se pudo subir la imagen'),
      });
  }

  private previewTheme(): void {
    const colors = this.themeForm().colors;
    const allValid = (Object.keys(colors) as (keyof SiteThemeColors)[]).every((key) =>
      isValidHex(colors[key]),
    );
    if (allValid) {
      this.siteSettings.applyThemePreview(this.themeForm());
    }
  }

  protected save(): void {
    this.saving.set(true);
    this.success.set(false);
    this.error.set('');

    const f = this.form();
    const payload: Partial<SiteSettings> = {
      topBannerText: f.topBannerText,
      topBannerPhone: f.topBannerPhone,
      topBannerCtaText: f.topBannerCtaText,
      topBannerCtaLink: f.topBannerCtaLink,
      deliveryHours: f.deliveryHours,
      promoMessage: f.promoMessage,
      secondaryLinks: this.secondaryLinks(),
      socialLinks: this.socialLinks(),
      paymentInfo: {
        pago_movil: { ...this.paymentInfoForm.pago_movil },
        zelle: { ...this.paymentInfoForm.zelle },
      },
      theme: this.themeForm(),
    };

    this.adminService
      .updateSettings(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.siteSettings.reload().subscribe();
          this.success.set(true);
          this.toast.success('Configuración guardada');
          setTimeout(() => this.success.set(false), 3000);
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'No se pudo guardar la configuración';
          this.error.set(msg);
          this.toast.error(msg);
        },
      });
  }
}
