import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideDynamicIcon } from '@lucide/angular';
import { Category } from '../../core/services/category.service';

@Component({
  selector: 'app-category-card',
  imports: [RouterLink, LucideDynamicIcon],
  template: `
    <a
      [routerLink]="['/shop']"
      [queryParams]="{ category: category().slug }"
      class="bg-canvas-soft rounded-xl p-lg flex flex-col items-center gap-md text-center min-w-36 shrink-0 hover:bg-canvas-softer transition"
      data-testid="category-card"
    >
      <span class="w-16 h-16 rounded-full bg-canvas grid place-items-center">
        <svg [lucideIcon]="category().icon" [size]="28" class="text-ink"></svg>
      </span>
      <span class="text-body-sm-strong" data-testid="category-name">{{ category().name }}</span>
      <span class="text-caption text-mute">{{ count() }} items</span>
    </a>
  `,
})
export class CategoryCard {
  readonly category = input.required<Category>();
  readonly count = input<number>(0);
}
