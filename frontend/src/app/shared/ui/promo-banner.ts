import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface PromoBanner {
  id: string;
  label: string;
  title: string;
  description: string;
  bgColor: string;
  textColor: string;
}

@Component({
  selector: 'app-promo-banner',
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="['/shop']"
      [queryParams]="{ promo: banner().id }"
      class="block rounded-xl p-xl md:p-2xl relative overflow-hidden hover:shadow-lg transition"
      [style.background-color]="banner().bgColor"
      data-testid="promo-banner"
    >
      <div class="relative z-10">
        <span
          class="inline-block rounded-pill px-md py-xxs text-caption font-bold mb-sm"
          [style.background-color]="banner().textColor"
          [style.color]="banner().bgColor"
        >
          {{ banner().label }}
        </span>
        <h3 class="text-display-sm font-bold mt-sm" [style.color]="banner().textColor">
          {{ banner().title }}
        </h3>
        <p class="text-body-sm mt-xs opacity-90" [style.color]="banner().textColor">
          {{ banner().description }}
        </p>
      </div>
      <!-- Decorative circle -->
      <div
        class="absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-20"
        [style.background-color]="banner().textColor"
      ></div>
    </a>
  `,
})
export class PromoBannerComponent {
  readonly banner = input.required<PromoBanner>();
}
