import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type PromoVariant = 'soft' | 'softer' | 'dark';

@Component({
  selector: 'app-promo-card',
  imports: [RouterLink],
  template: `
    <section
      class="rounded-xl p-2xl flex items-center justify-between gap-xl h-full"
      [class]="variantClass()"
      data-testid="promo-card"
    >
      <div class="flex flex-col gap-lg flex-1 min-w-0 justify-center">
        <h3 class="text-display-sm font-bold leading-tight">{{ title() }}</h3>
        <a
          routerLink="/shop"
          [class]="variant() === 'dark' ? 'btn-secondary self-start' : 'btn-primary self-start'"
          data-testid="promo-cta"
          >{{ cta() }}</a
        >
      </div>
      @if (image()) {
        <img
          [src]="image()"
          [alt]="title()"
          loading="lazy"
          decoding="async"
          class="w-28 h-28 md:w-32 md:h-32 object-cover rounded-xl shrink-0"
        />
      }
    </section>
  `,
})
export class PromoCard {
  readonly title = input.required<string>();
  readonly cta = input<string>('Comprar ahora');
  readonly variant = input<PromoVariant>('soft');
  readonly image = input<string>('');

  protected readonly variantClass = computed(() => {
    switch (this.variant()) {
      case 'dark':
        return 'bg-black-elevated text-on-dark';
      case 'softer':
        return 'bg-canvas-softer text-ink';
      default:
        return 'bg-canvas-soft text-ink';
    }
  });
}
