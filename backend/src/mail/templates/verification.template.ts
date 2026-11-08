import { escapeHtml, renderLayout } from './layout.js';
import type { EmailContent } from './types.js';

export interface VerificationTemplateData {
  firstName: string;
  link: string;
}

export function verificationTemplate({
  firstName,
  link,
}: VerificationTemplateData): EmailContent {
  return {
    subject: 'Verifica tu correo en Market',
    text: `Hola ${firstName}, confirma tu cuenta abriendo este enlace: ${link}\n\nEl enlace vence en 24 horas. Si no creaste esta cuenta, ignora este mensaje.`,
    html: renderLayout({
      greeting: `Hola ${escapeHtml(firstName)},`,
      intro: 'Confirma tu cuenta para empezar a comprar en Market.',
      link,
      cta: 'Verificar mi correo',
      footer:
        'El enlace vence en 24 horas. Si no creaste esta cuenta, ignora este mensaje.',
    }),
    link,
  };
}
