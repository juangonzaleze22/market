import { escapeHtml, renderLayout } from './layout.js';
import type { EmailContent } from './types.js';

export interface AccountExistsTemplateData {
  firstName: string;
  link: string;
}

export function accountExistsTemplate({
  firstName,
  link,
}: AccountExistsTemplateData): EmailContent {
  return {
    subject: 'Tu cuenta de Market ya existe',
    text: `Hola ${firstName}, alguien intentó registrarse con este correo y ya tienes una cuenta en Market. Si olvidaste tu contraseña, restablécela aquí: ${link}\n\nSi no fuiste tú, ignora este mensaje.`,
    html: renderLayout({
      greeting: `Hola ${escapeHtml(firstName)},`,
      intro:
        'Alguien intentó crear una cuenta con este correo, pero ya tienes una en Market.',
      link,
      cta: 'Restablecer contraseña',
      footer: 'Si no fuiste tú, ignora este mensaje.',
    }),
    link,
  };
}
