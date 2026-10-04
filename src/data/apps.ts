// FreeSense family apps. Nav, /apps and the homepage slider read from here.
export interface App {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  platform: string;
  logo: string;
  hero: string;
  repo: string;
  releases: string;
  version: string;
  isNew?: boolean;
}

export const apps: App[] = [
  {
    slug: 'netspider',
    name: 'NetSpider',
    tagline: 'Where exactly does it break?',
    summary:
      'Layer 2 and Layer 3 network diagnostics for Windows: device discovery, MAC-level latency, Path Doctor fault localization, Storm Center and Wi-Fi ↔ LAN testing, drawn as a live spider web.',
    platform: 'Windows 10/11 · x64, ARM64, x86',
    logo: '/apps/netspider/logo.png',
    hero: '/apps/netspider/spider-web.webp',
    repo: 'https://github.com/FreeSense-org/NetSpider',
    releases: 'https://github.com/FreeSense-org/NetSpider/releases/latest',
    version: '0.1.0',
    isNew: true,
  },
];
