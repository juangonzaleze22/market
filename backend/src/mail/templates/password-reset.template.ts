import { escapeHtml, renderLayout } from './layout.js';
import type { EmailContent } from './types.js';

export interface PasswordResetTemplateData {
  firstName: string;
  link: string;
}

export function passwordResetTemplate({
  firstName,
  link,
}: PasswordResetTemplateData): EmailContent {
  return {
    subject: 'Restablece tu contraseña de Market',
    text: `Hola ${firstName}, restablece tu contraseña abriendo este enlace: ${link}\n\nEl enlace vence en 30 minutos. Si no lo solicitaste, ignora este mensaje.`,
    html: renderLayout({
      greeting: `Hola ${escapeHtml(firstName)},`,
      intro: 'Recibimos una solicitud para restablecer tu contraseña.',
      link,
      cta: 'Restablecer contraseña',
      footer:
        'El enlace vence en 30 minutos. Si no lo solicitaste, ignora este mensaje.',
    }),
    link,
  };
}
