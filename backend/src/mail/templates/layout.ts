export interface LayoutOptions {
  greeting: string;
  intro: string;
  link: string;
  cta: string;
  footer: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderLayout({
  greeting,
  intro,
  link,
  cta,
  footer,
}: LayoutOptions): string {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f3f3f3;font-family:Inter,system-ui,'Helvetica Neue',Arial,sans-serif;color:#000">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px">
      <p style="font-size:24px;font-weight:800;margin:0 0 24px">Market<span style="color:#afafaf">.</span></p>
      <p style="font-size:16px;margin:0 0 8px">${greeting}</p>
      <p style="font-size:14px;line-height:1.5;color:#5e5e5e;margin:0 0 24px">${intro}</p>
      <p style="margin:0 0 24px">
        <a href="${link}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;border-radius:999px;padding:12px 24px;font-size:14px;font-weight:600">${cta}</a>
      </p>
      <p style="font-size:12px;line-height:1.5;color:#5e5e5e;margin:0">${footer}</p>
    </div>
  </body>
</html>`;
}
