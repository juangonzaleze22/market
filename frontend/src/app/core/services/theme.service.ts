import { Injectable, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  DEFAULT_SITE_THEME,
  normalizeTheme,
  SiteTheme,
  SiteThemeBranding,
  SiteThemeColors,
} from '../models/site-theme';

const COLOR_VARIABLES: Record<keyof SiteThemeColors, string> = {
  primary: '--color-primary',
  onPrimary: '--color-on-primary',
  accent: '--color-accent',
  onAccent: '--color-on-accent',
  link: '--color-link',
};

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly themeSignal = signal<SiteTheme>(DEFAULT_SITE_THEME);
  private manifestObjectUrl: string | null = null;
  private originalManifestHref =
    this.document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.getAttribute('href') ??
    'manifest.webmanifest';

  readonly theme = this.themeSignal.asReadonly();
  readonly branding = computed(() => this.themeSignal().branding);

  apply(theme: Partial<SiteTheme> | null | undefined): SiteTheme {
    const resolved = normalizeTheme(theme);
    this.themeSignal.set(resolved);
    this.applyColors(resolved.colors);
    this.applyBranding(resolved.branding, resolved.colors);
    return resolved;
  }

  private applyColors(colors: SiteThemeColors): void {
    const root = this.document.documentElement;
    (Object.keys(COLOR_VARIABLES) as (keyof SiteThemeColors)[]).forEach((key) => {
      const value = colors[key];
      if (value) {
        root.style.setProperty(COLOR_VARIABLES[key], value);
      }
    });
    this.setMetaThemeColor(colors.primary);
  }

  private applyBranding(branding: SiteThemeBranding, colors: SiteThemeColors): void {
    if (branding.brandName) {
      this.document.title = branding.brandName;
    }
    this.setFavicon(branding.faviconUrl);
    this.setAppleTouchIcon(branding.pwaIconUrl);
    this.setManifest(branding, colors);
  }

  private setMetaThemeColor(color: string): void {
    if (!color) {
      return;
    }
    let meta = this.document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = this.document.createElement('meta');
      meta.name = 'theme-color';
      this.document.head.appendChild(meta);
    }
    meta.content = color;
  }

  private setFavicon(url: string): void {
    if (!url) {
      return;
    }
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'icon';
      this.document.head.appendChild(link);
    }
    link.type = this.mimeFromUrl(url);
    link.href = url;
  }

  private setAppleTouchIcon(url: string): void {
    if (!url) {
      return;
    }
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'apple-touch-icon';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }

  private setManifest(branding: SiteThemeBranding, colors: SiteThemeColors): void {
    const link = this.document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      return;
    }

    const isDefaultIcon =
      branding.pwaIconUrl === DEFAULT_SITE_THEME.branding.pwaIconUrl;
    if (isDefaultIcon) {
      link.href = this.originalManifestHref;
      return;
    }

    try {
      const base = this.document.baseURI;
      const manifest = {
        name: branding.brandName,
        short_name: branding.brandName,
        display: 'standalone',
        scope: base,
        start_url: base,
        theme_color: colors.primary,
        background_color: '#ffffff',
        icons: [
          {
            src: branding.pwaIconUrl,
            sizes: '192x192',
            type: this.mimeFromUrl(branding.pwaIconUrl),
            purpose: 'maskable any',
          },
          {
            src: branding.pwaIconUrl,
            sizes: '512x512',
            type: this.mimeFromUrl(branding.pwaIconUrl),
            purpose: 'maskable any',
          },
        ],
      };
      const blob = new Blob([JSON.stringify(manifest)], {
        type: 'application/manifest+json',
      });
      if (this.manifestObjectUrl) {
        URL.revokeObjectURL(this.manifestObjectUrl);
      }
      this.manifestObjectUrl = URL.createObjectURL(blob);
      link.href = this.manifestObjectUrl;
    } catch {
      link.href = this.originalManifestHref;
    }
  }

  private mimeFromUrl(url: string): string {
    const path = url.split('?')[0].toLowerCase();
    if (path.endsWith('.svg')) {
      return 'image/svg+xml';
    }
    if (path.endsWith('.png')) {
      return 'image/png';
    }
    if (path.endsWith('.webp')) {
      return 'image/webp';
    }
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      return 'image/jpeg';
    }
    return 'image/x-icon';
  }
}
