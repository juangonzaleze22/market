import { escapeHtml, renderLayout } from './layout.js';
import type { EmailContent } from './types.js';

export interface BackInStockTemplateData {
  productName: string;
  link: string;
}

export function backInStockTemplate({
  productName,
  link,
}: BackInStockTemplateData): EmailContent {
  return {
    subject: `¡${productName} volvió a estar disponible!`,
    text: `Buenas noticias: ${productName} volvió a tener stock en Market. Compra antes de que se agote: ${link}`,
    html: renderLayout({
      greeting: 'Buenas noticias,',
      intro: `<strong>${escapeHtml(productName)}</strong> volvió a estar disponible en Market.`,
      link,
      cta: 'Ver producto',
      footer:
        'Recibes este correo porque pediste que te avisáramos cuando este producto volviera a estar disponible.',
    }),
    link,
  };
}
