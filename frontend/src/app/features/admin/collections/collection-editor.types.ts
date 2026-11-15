import type { SuggestionRule } from '../../../core/services/collection.service';

export interface CollectionProductSelection {
  productId: string;
  position: number;
}

export interface CollectionFormState {
  title: string;
  slug: string;
  subtitle: string;
  imageUrl: string;
  placements: string[];
  maxItems: number;
  sortOrder: number;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  products: CollectionProductSelection[];
}

export const EMPTY_FORM: CollectionFormState = {
  title: '',
  slug: '',
  subtitle: '',
  imageUrl: '',
  placements: ['home', 'shop'],
  maxItems: 10,
  sortOrder: 0,
  isActive: true,
  startsAt: '',
  endsAt: '',
  products: [],
};

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const SUGGESTION_RULES: { value: SuggestionRule; label: string }[] = [
  { value: 'BEST_SELLERS', label: 'Más vendidos' },
  { value: 'NEWEST', label: 'Nuevos' },
  { value: 'ON_SALE', label: 'En oferta' },
];

export function toInputDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
