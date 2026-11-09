import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { Breadcrumb, PageHero } from '../../shared/ui/page-hero';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { BranchService } from '../../core/services/branch.service';

interface StoryImage {
  src: string;
  alt: string;
}

interface Stat {
  value: string;
  label: string;
}

interface TeamMember {
  name: string;
  role: string;
  initials: string;
}

interface Benefit {
  icon: string;
  title: string;
  text: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-about',
  imports: [PageHero],
  template: `
    <div data-testid="about-page">
      <app-page-hero title="Quiénes somos" [breadcrumbs]="breadcrumbs" />

      <!-- Nuestra historia -->
      <section class="container-max about-story" data-testid="about-story">
        <div class="story-media">
          <div class="story-grid">
            @for (image of storyImages; track image.src) {
              <img [src]="image.src" [alt]="image.alt" class="story-img" loading="lazy" />
            }
          </div>
          <div class="story-badge">
            <strong>5+</strong>
            <span>años de<br />trayectoria</span>
          </div>
        </div>

        <div class="story-body">
          <p class="m-0 text-body-sm font-semibold uppercase tracking-wider text-primary">Nuestra historia</p>
          <h2 class="m-0 text-balance text-display-xxl font-bold text-ink max-lg:text-display-xl" data-testid="about-story-title">
            Tu tienda de confianza para <span class="text-primary">cada día</span>
          </h2>
          <p class="m-0 measure text-body-lg text-body">
            En Tu Mercadito creemos que comprar lo esencial debería ser simple, rápido y
            confiable. Desde 2021 conectamos a miles de familias con productos de calidad, a
            precios justos y con entregas que llegan cuando prometemos.
          </p>

          <ul class="story-checklist" data-testid="about-story-checklist">
            @for (item of highlights; track item) {
              <li>
                <span class="check" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>{{ item }}</span>
              </li>
            }
          </ul>

          <div class="story-signature">
            <img src="/assets/icons/logo.png" alt="Tu Mercadito" class="signature-logo" />
            <p class="m-0 text-body-sm text-body">Equipo fundador · Desde 2021</p>
          </div>
        </div>
      </section>

      <!-- Banda de impacto -->
      <section class="container-max" data-testid="about-stats">
        <div class="impact-band">
          <div class="impact-copy">
            <p class="m-0 text-body-sm font-semibold uppercase tracking-wider text-on-dark/70">Nuestro impacto</p>
            <h2 class="m-0 text-display-xl font-bold">Comprar bien, <span class="text-accent">sin complicaciones</span></h2>
            <p class="m-0 measure text-body-lg text-on-dark/80">
              Cada pedido es una promesa: productos seleccionados con cuidado, precios claros y
              una entrega puntual en la puerta de tu casa.
            </p>
          </div>

          <div class="impact-stats">
            @for (stat of stats(); track stat.label) {
              <div class="stat">
                <strong>{{ stat.value }}</strong>
                <span>{{ stat.label }}</span>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Visión y misión -->
      <section class="purpose-section">
        <div class="container-max about-purpose">
          <article class="purpose-card" data-testid="about-vision">
            <span class="purpose-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <h3 class="m-0 mb-sm text-display-md font-bold text-ink">Nuestra visión</h3>
            <p class="m-0 text-body-md text-body">
              Ser la tienda en línea de referencia para las familias, reconocida por la cercanía,
              la confianza y la calidad de cada entrega.
            </p>
          </article>

          <article class="purpose-card" data-testid="about-mission">
            <span class="purpose-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1" />
              </svg>
            </span>
            <h3 class="m-0 mb-sm text-display-md font-bold text-ink">Nuestra misión</h3>
            <p class="m-0 text-body-md text-body">
              Acercar los productos que necesitas cada día con una experiencia de compra simple,
              precios justos y entregas puntuales.
            </p>
          </article>
        </div>
      </section>

      <!-- Equipo -->
      <section class="container-max about-team" data-testid="about-team">
        <div class="team-heading">
          <p class="m-0 text-body-sm font-semibold uppercase tracking-wider text-primary">Nuestro equipo</p>
          <h2 class="m-0 text-balance text-display-xxl font-bold text-ink max-lg:text-display-xl">Conoce a las personas detrás de <span class="text-primary">Tu Mercadito</span></h2>
          <p class="m-0 text-body-lg text-body">Un equipo pequeño con una idea grande: hacer tus compras más fáciles.</p>
        </div>

        <div class="team-grid">
          @for (member of team; track member.name) {
            <article class="team-card" data-testid="about-team-card">
              <div class="team-avatar" aria-hidden="true">
                <span class="team-avatar-initials">{{ member.initials }}</span>
              </div>
              <h3 class="m-0 mb-xxs text-body-lg font-semibold text-ink">{{ member.name }}</h3>
              <p class="m-0 text-body-sm text-body">{{ member.role }}</p>
            </article>
          }
        </div>
      </section>

      <!-- Beneficios -->
      <section class="container-max about-benefits" data-testid="about-benefits">
        @for (benefit of benefits; track benefit.title) {
          <div class="benefit">
            <img [src]="benefit.icon" alt="" aria-hidden="true" class="benefit-icon" />
            <div>
              <p class="m-0 mb-xxs text-body-lg font-semibold text-ink">{{ benefit.title }}</p>
              <p class="m-0 text-body-sm text-body">{{ benefit.text }}</p>
            </div>
          </div>
        }
      </section>

      <!-- Newsletter -->
      <section class="newsletter-section" data-testid="about-newsletter">
        <div class="newsletter-pattern" aria-hidden="true"></div>
        <div class="container-max newsletter-inner">
          <p class="m-0 text-body-sm font-semibold uppercase tracking-wider text-primary">Novedades y ofertas</p>
          <h2 class="m-0 newsletter-title text-balance text-display-xxl font-bold text-ink max-lg:text-display-xl">Suscríbete y recibe <span class="text-primary">ofertas exclusivas</span></h2>
          <p class="m-0 measure text-body-lg text-body">
            Recibe un cupón de bienvenida y entérate de nuestras promociones antes que nadie.
          </p>

          @if (!subscribed()) {
            <form class="newsletter-form" (submit)="subscribe($event)" novalidate>
              <label for="newsletter-email" class="newsletter-label">Correo electrónico</label>
              <div class="newsletter-row">
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  placeholder="tu@correo.com"
                  class="newsletter-input"
                  [class.input-error]="error()"
                  [value]="email()"
                  [attr.aria-invalid]="error() ? 'true' : null"
                  (input)="onEmailInput($event)"
                  data-testid="about-newsletter-email"
                />
                <button type="submit" class="newsletter-btn" data-testid="about-newsletter-submit">
                  Suscribirme
                </button>
              </div>
              @if (error()) {
                <p class="form-error newsletter-error" role="alert" data-testid="about-newsletter-error">
                  {{ error() }}
                </p>
              }
            </form>
          } @else {
            <p class="newsletter-success" role="status" data-testid="about-newsletter-success">
              ¡Gracias por suscribirte! Pronto recibirás nuestras novedades.
            </p>
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    .measure {
      max-width: 34rem;
    }

    .newsletter-title {
      max-width: 44rem;
    }

    /* ─── Story ──────────────────────────────────── */
    .about-story {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
      align-items: center;
      gap: calc(var(--spacing-3xl) * 1.5);
      padding-top: calc(var(--spacing-3xl) * 2);
      padding-bottom: calc(var(--spacing-3xl) * 2);
    }

    .story-media {
      position: relative;
      background-color: var(--color-canvas-soft);
      border-radius: var(--radius-xl);
      padding: var(--spacing-lg);
    }

    .story-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
    }

    .story-img {
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      background-color: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      display: block;
    }

    .story-badge {
      position: absolute;
      top: var(--spacing-lg);
      left: calc(var(--spacing-lg) * -1);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md) var(--spacing-lg);
      background-color: var(--color-accent);
      color: var(--color-on-accent);
      border-radius: var(--radius-lg);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
    }

    .story-badge strong {
      font-size: var(--text-display-xl);
      line-height: 1;
      font-weight: 700;
    }

    .story-badge span {
      font-size: var(--text-body-xs);
      line-height: var(--text-body-xs--line-height);
      font-weight: 500;
    }

    .story-body {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .story-checklist {
      list-style: none;
      margin: var(--spacing-sm) 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .story-checklist li {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      font-size: var(--text-body-lg);
      line-height: var(--text-body-lg--line-height);
      font-weight: 500;
      color: var(--color-ink);
    }

    .check {
      width: 20px;
      height: 20px;
      margin-top: 2px;
      border-radius: var(--radius-full);
      background-color: var(--color-accent);
      color: var(--color-on-accent);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .check svg {
      width: 12px;
      height: 12px;
    }

    .story-signature {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      margin-top: var(--spacing-lg);
      padding-top: var(--spacing-xl);
      border-top: 1px solid var(--color-surface-pressed);
    }

    .signature-logo {
      height: 32px;
      width: auto;
      max-width: 160px;
      object-fit: contain;
    }

    /* ─── Impact band ────────────────────────────── */
    .impact-band {
      position: relative;
      overflow: hidden;
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      align-items: center;
      gap: calc(var(--spacing-3xl) * 1.5);
      padding: calc(var(--spacing-3xl) * 1.5);
      background-color: var(--color-primary);
      color: var(--color-on-dark);
      border-radius: var(--radius-xl);
    }

    .impact-band::before {
      content: "";
      position: absolute;
      top: -40%;
      right: -10%;
      width: 480px;
      height: 480px;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        color-mix(in srgb, var(--color-accent) 22%, transparent) 0%,
        transparent 65%
      );
      pointer-events: none;
    }

    .impact-copy {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .impact-stats {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xxs);
      padding: var(--spacing-lg);
      border-radius: var(--radius-lg);
      background-color: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .stat strong {
      font-size: var(--text-display-lg);
      line-height: var(--text-display-lg--line-height);
      font-weight: 700;
      color: var(--color-on-dark);
    }

    .stat span {
      font-size: var(--text-body-sm);
      line-height: var(--text-body-sm--line-height);
      color: color-mix(in srgb, var(--color-on-dark) 75%, transparent);
    }

    /* ─── Purpose ────────────────────────────────── */
    .purpose-section {
      margin-top: calc(var(--spacing-3xl) * 2);
      padding: calc(var(--spacing-3xl) * 2) 0;
      background-color: var(--color-canvas-softer);
    }

    .about-purpose {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-2xl);
    }

    .purpose-card {
      background-color: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      padding: var(--spacing-3xl);
    }

    .purpose-icon {
      width: 48px;
      height: 48px;
      display: grid;
      place-items: center;
      margin-bottom: var(--spacing-lg);
      border-radius: var(--radius-md);
      background-color: var(--color-primary);
      color: var(--color-on-primary);
    }

    .purpose-icon svg {
      width: 24px;
      height: 24px;
    }

    /* ─── Team ───────────────────────────────────── */
    .about-team {
      padding-top: calc(var(--spacing-3xl) * 2);
      padding-bottom: calc(var(--spacing-3xl) * 2);
    }

    .team-heading {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      align-items: center;
      text-align: center;
      max-width: 40rem;
      margin: 0 auto var(--spacing-3xl);
    }

    .team-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: var(--spacing-xl);
    }

    .team-avatar {
      position: relative;
      aspect-ratio: 4 / 5;
      display: grid;
      place-items: center;
      margin-bottom: var(--spacing-lg);
      border-radius: var(--radius-xl);
      background: linear-gradient(
        160deg,
        var(--color-canvas-soft) 0%,
        color-mix(in srgb, var(--color-primary) 10%, var(--color-canvas)) 100%
      );
      overflow: hidden;
    }

    .team-avatar::before {
      content: "";
      position: absolute;
      width: 62%;
      aspect-ratio: 1 / 1;
      border-radius: var(--radius-full);
      background-color: color-mix(in srgb, var(--color-canvas) 55%, transparent);
    }

    .team-avatar-initials {
      position: relative;
      z-index: 1;
      width: 96px;
      height: 96px;
      display: grid;
      place-items: center;
      border-radius: var(--radius-full);
      background-color: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      color: var(--color-primary);
      font-size: var(--text-display-xl);
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    /* ─── Benefits ───────────────────────────────── */
    .about-benefits {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--spacing-2xl);
      padding-bottom: calc(var(--spacing-3xl) * 2);
    }

    .benefit {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
    }

    .benefit-icon {
      width: 44px;
      height: 44px;
      object-fit: contain;
      flex-shrink: 0;
    }

    /* ─── Newsletter ─────────────────────────────── */
    .newsletter-section {
      position: relative;
      overflow: hidden;
      background-color: var(--color-canvas-softer);
      padding: calc(var(--spacing-3xl) * 2) 0;
    }

    .newsletter-pattern {
      position: absolute;
      inset: 0;
      opacity: 0.5;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231C8057' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      pointer-events: none;
    }

    .newsletter-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-sm);
      text-align: center;
    }

    .newsletter-form {
      width: 100%;
      max-width: 34rem;
      margin-top: var(--spacing-lg);
    }

    .newsletter-label {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .newsletter-row {
      display: flex;
      gap: var(--spacing-md);
    }

    .newsletter-input {
      flex: 1;
      min-width: 0;
      box-sizing: border-box;
      padding: var(--spacing-md) var(--spacing-xl);
      background-color: var(--color-canvas);
      color: var(--color-ink);
      font-size: var(--text-body-md);
      line-height: var(--text-body-md--line-height);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-pill);
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .newsletter-input::placeholder {
      color: var(--color-mute);
    }

    .newsletter-input:focus {
      border-color: var(--color-primary);
      box-shadow: inset 0 0 0 1px var(--color-primary);
    }

    .newsletter-input.input-error {
      border-color: #dc2626;
      box-shadow: inset 0 0 0 1px #dc2626;
    }

    .newsletter-btn {
      padding: var(--spacing-md) var(--spacing-2xl);
      background-color: var(--color-accent);
      color: var(--color-on-accent);
      font-size: var(--text-button-md);
      line-height: var(--text-button-md--line-height);
      font-weight: 600;
      border: none;
      border-radius: var(--radius-pill);
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.2s ease;
    }

    .newsletter-btn:hover {
      opacity: 0.9;
    }

    .newsletter-error {
      margin: var(--spacing-sm) 0 0;
      text-align: left;
      padding-left: var(--spacing-xl);
    }

    .newsletter-success {
      margin: var(--spacing-lg) 0 0;
      padding: var(--spacing-md) var(--spacing-xl);
      background-color: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-pill);
      font-size: var(--text-body-md);
      line-height: var(--text-body-md--line-height);
      color: var(--color-ink);
    }

    /* ─── Responsive ─────────────────────────────── */
    @media (max-width: 1024px) {
      .about-story {
        gap: var(--spacing-3xl);
      }

      .team-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--spacing-2xl);
      }
    }

    @media (max-width: 860px) {
      .about-story {
        grid-template-columns: 1fr;
        padding-top: calc(var(--spacing-3xl) * 1.5);
        padding-bottom: calc(var(--spacing-3xl) * 1.5);
      }

      .story-media {
        max-width: 34rem;
        margin: 0 auto;
      }

      .purpose-section {
        margin-top: calc(var(--spacing-3xl) * 1.5);
        padding: calc(var(--spacing-3xl) * 1.5) 0;
      }

      .about-purpose {
        grid-template-columns: 1fr;
      }

      .impact-band {
        grid-template-columns: 1fr;
        gap: var(--spacing-2xl);
        padding: var(--spacing-3xl);
      }

      .about-benefits {
        grid-template-columns: 1fr;
        gap: var(--spacing-lg);
        padding-bottom: calc(var(--spacing-3xl) * 1.5);
      }

      .about-team {
        padding-top: calc(var(--spacing-3xl) * 1.5);
        padding-bottom: calc(var(--spacing-3xl) * 1.5);
      }

      .newsletter-section {
        padding: calc(var(--spacing-3xl) * 1.5) 0;
      }
    }

    @media (max-width: 560px) {
      .story-badge {
        left: var(--spacing-lg);
      }

      .newsletter-row {
        flex-direction: column;
      }

      .newsletter-btn {
        width: 100%;
      }

      .team-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--spacing-lg);
      }

      .impact-stats {
        gap: var(--spacing-md);
      }

      .purpose-card {
        padding: var(--spacing-2xl);
      }
    }
  `,
})
export class About implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly branchService = inject(BranchService);

  private readonly branchReload = effect(() => {
    const loaded = this.branchService.loaded();
    this.branchService.selectedBranch();
    if (!loaded) return;
    untracked(() => this.loadCounts());
  });

  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', link: '/' },
    { label: 'Quiénes somos' },
  ];

  protected readonly storyImages: StoryImage[] = [
    {
      src: 'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215319_75c6644f-b471-456c-84cd-f6c66ac9d5b9.png',
      alt: 'Selección de productos de Tu Mercadito',
    },
    {
      src: 'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215319_0c90fb36-d783-4c9c-ae9b-c7d0d97a030b.png',
      alt: 'Moda disponible en Tu Mercadito',
    },
    {
      src: 'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215225_538a0db6-7afb-41fc-a207-924be258ebfd.png',
      alt: 'Ropa básica disponible en Tu Mercadito',
    },
    {
      src: 'https://d8j0ntlcm91z4.cloudfront.net/user_3HjzMlbE9jkpU7f4oQWQ5CL4M82/hf_20260908_215319_2da8ec51-fdf1-4ed8-931a-5bc65340c248.png',
      alt: 'Artículos para el hogar de Tu Mercadito',
    },
  ];

  protected readonly highlights: string[] = [
    'Productos verificados y de marcas confiables',
    'Entregas rápidas en la puerta de tu casa',
    'Atención cercana antes, durante y después de tu compra',
  ];

  private readonly productCount = signal<number | null>(null);
  private readonly categoryCount = signal<number | null>(null);

  protected readonly stats = computed<Stat[]>(() => [
    { value: '+5', label: 'años de experiencia' },
    { value: this.formatCount(this.productCount()), label: 'productos disponibles' },
    { value: this.formatCount(this.categoryCount()), label: 'categorías de productos' },
    { value: '98%', label: 'clientes satisfechos' },
  ]);

  protected readonly team: TeamMember[] = [
    { name: 'María González', role: 'Fundadora & CEO', initials: 'MG' },
    { name: 'Carlos Pérez', role: 'Gerente de operaciones', initials: 'CP' },
    { name: 'Ana Rodríguez', role: 'Atención al cliente', initials: 'AR' },
    { name: 'Luis Martínez', role: 'Logística y entregas', initials: 'LM' },
  ];

  protected readonly benefits: Benefit[] = [
    {
      icon: '/assets/icons/box.png',
      title: 'Envío gratis',
      text: 'En pedidos mayores a $50',
    },
    {
      icon: '/assets/icons/bills.png',
      title: 'Pago flexible',
      text: 'Múltiples opciones seguras',
    },
    {
      icon: '/assets/icons/support.png',
      title: 'Soporte 24/7',
      text: 'Te acompañamos todos los días',
    },
  ];

  protected readonly email = signal('');
  protected readonly error = signal('');
  protected readonly subscribed = signal(false);

  ngOnInit(): void {
    this.branchService.load();
  }

  private loadCounts(): void {
    this.productService
      .getAll()
      .subscribe((products) => this.productCount.set(products.length));
    this.categoryService
      .getAll()
      .subscribe((categories) => this.categoryCount.set(categories.length));
  }

  private formatCount(count: number | null): string {
    return count === null ? '—' : count.toLocaleString('es-VE');
  }

  protected onEmailInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.email.set(target.value);
    if (this.error()) this.error.set('');
  }

  protected subscribe(event: Event): void {
    event.preventDefault();
    const email = this.email().trim();

    if (!EMAIL_PATTERN.test(email)) {
      this.error.set('Ingresa un correo electrónico válido.');
      return;
    }

    this.error.set('');
    this.subscribed.set(true);
  }
}
