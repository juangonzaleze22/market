export interface SiteThemeColors {
  primary: string;
  onPrimary: string;
  brand: string;
  onBrand: string;
  accent: string;
  onAccent: string;
  link: string;
}

export interface SiteThemeBranding {
  brandName: string;
  logoUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  pwaIconUrl: string;
}

export interface SiteTheme {
  colors: SiteThemeColors;
  branding: SiteThemeBranding;
}

export const DEFAULT_SITE_THEME: SiteTheme = {
  colors: {
    primary: '#1C8057',
    onPrimary: '#ffffff',
    brand: '#1C8057',
    onBrand: '#ffffff',
    accent: '#f5a623',
    onAccent: '#1C8057',
    link: '#1C8057',
  },
  branding: {
    brandName: 'Tu Mercadito',
    logoUrl: '/assets/icons/logo.png',
    logoDarkUrl: '/assets/icons/logo-white.webp',
    faviconUrl: '/favicon.ico',
    pwaIconUrl: '/icons/icon-192x192.png',
  },
};

export function normalizeTheme(theme: Partial<SiteTheme> | null | undefined): SiteTheme {
  const branding: SiteThemeBranding = {
    ...DEFAULT_SITE_THEME.branding,
    ...(theme?.branding ?? {}),
  };

  if (!branding.brandName?.trim()) {
    branding.brandName = DEFAULT_SITE_THEME.branding.brandName;
  }
  (
    ['logoUrl', 'logoDarkUrl', 'faviconUrl', 'pwaIconUrl'] as const
  ).forEach((key) => {
    if (!branding[key]?.trim()) {
      branding[key] = DEFAULT_SITE_THEME.branding[key];
    }
  });

  const incomingColors: Partial<SiteThemeColors> = theme?.colors ?? {};
  const primary = incomingColors.primary?.trim() || DEFAULT_SITE_THEME.colors.primary;
  const onPrimary = incomingColors.onPrimary?.trim() || DEFAULT_SITE_THEME.colors.onPrimary;

  return {
    colors: {
      ...DEFAULT_SITE_THEME.colors,
      ...incomingColors,
      primary,
      onPrimary,
      brand: incomingColors.brand?.trim() || primary,
      onBrand: incomingColors.onBrand?.trim() || onPrimary,
    },
    branding,
  };
}
