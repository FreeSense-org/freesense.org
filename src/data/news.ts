// Project news, newest first. Each post renders at /news/<slug>/.
// `body` is trusted, hand-written HTML.
export interface NewsPost {
  slug: string;
  date: string; // YYYY-MM-DD
  tag: string;
  title: string;
  summary: string;
  image?: string;
  imageAlt?: string;
  link?: { href: string; label: string };
  body: string;
}

export const news: NewsPost[] = [
  {
    slug: 'introducing-netspider',
    date: '2026-10-04',
    tag: 'New app',
    title: 'Introducing NetSpider: see exactly where your network breaks',
    summary:
      'NetSpider joins the FreeSense family: a free, open-source Layer 2 / Layer 3 diagnostic tool for Windows that maps every device and pinpoints the failing hop.',
    image: '/apps/netspider/spider-web.webp',
    imageAlt: 'NetSpider spider-web view of a home network with per-device latency',
    link: { href: '/apps/netspider', label: 'Meet NetSpider' },
    body: `
      <p>Today we are releasing <strong>NetSpider 0.1.0</strong>, the first app in the FreeSense family that runs on
      your desktop rather than on your firewall. FreeSense protects the edge of your network; NetSpider shows you what
      happens inside it.</p>
      <p>NetSpider finds every device on your network, identifies it, and measures latency both at the MAC level
      (ARP/NDP) and at the IP level (ICMP/TCP). The results appear as a live, animated spider web, so a slow access
      point or a failing switch stands out at a glance.</p>
      <h2>Path Doctor: where does it break?</h2>
      <p>Path Doctor continuously probes every hop from your PC through access points, switches, the router, the ISP
      modem and the ISP's own hops. When something stops answering, its fault locator combines the first failing hop,
      the devices that dropped at the same time and switch-port evidence into an incident with a plain-language root
      cause and a confidence score.</p>
      <h2>Storms, loops and Wi-Fi</h2>
      <p>Storm Center tracks broadcast, multicast and unknown-unicast levels against a learned baseline and maps the top
      sources to their switch port. On a PC with both Ethernet and Wi-Fi, NetSpider can measure true one-way latency
      across the switch and access point by sending frames on one adapter and catching them on the other.</p>
      <h2>Get it</h2>
      <p>NetSpider is Apache-2.0 licensed and runs on Windows 10 and 11 (x64, ARM64 and x86). Choose the per-user
      Setup.exe for automatic updates, a standalone exe or portable zip, or the MSI for managed deployment. It needs
      <a href="https://npcap.com" rel="noopener">Npcap</a> for packet capture and will guide you through installing it.
      This first build is not code-signed yet, so Windows SmartScreen may ask you to confirm.</p>
    `,
  },
  {
    slug: 'raspberry-pi-arm64-preview',
    date: '2026-08-31',
    tag: 'Downloads',
    title: 'ARM64 and Raspberry Pi preview images',
    summary:
      'The download page now offers a generic ARM64 UEFI installer plus experimental Raspberry Pi 4B and Pi 5 D0 appliance images.',
    link: { href: '/download', label: 'Open the download page' },
    body: `
      <p>FreeSense downloads are now architecture-aware. Alongside the supported amd64 images you can choose a generic
      ARM64 UEFI installer, a Raspberry Pi 4B appliance image, or a Pi 5 D0 appliance image that uses third-party
      UEFI firmware.</p>
      <p>ARM64 builds are <strong>experimental and unsupported</strong>. They are meant for labs and testing, not
      production. Each artifact shows its own hardware-verification label; check the
      <a href="https://docs.freesense.org/getting-started/raspberry-pi/">Raspberry Pi flashing guide</a> before you
      start.</p>
    `,
  },
  {
    slug: 'official-cloud-images',
    date: '2026-07-31',
    tag: 'Release',
    title: 'Official FreeSense cloud images',
    summary:
      'Boot a preinstalled FreeSense disk in Proxmox, OpenStack, QEMU/KVM or bhyve: QCOW2 and raw GPT, UFS or ZFS, BIOS and UEFI.',
    link: { href: '/download/?image=ufs&format=qcow2#release-channels', label: 'Choose a cloud image' },
    body: `
      <p>Every FreeSense release now ships preinstalled cloud disks next to the installer ISO. Import a QCOW2 or raw GPT
      image into Proxmox, OpenStack, QEMU/KVM, bhyve or another compatible platform and skip the installer entirely.</p>
      <p>Choose UFS for a compact 16 GiB sparse disk, or ZFS for a 32 GiB disk with boot environments. Images support
      BIOS and UEFI, grow the root disk automatically, include the QEMU guest agent, and read NoCloud, ConfigDrive and
      OpenStack metadata on first boot. See the
      <a href="https://docs.freesense.org/getting-started/cloud-images/">cloud deployment guide</a> for details.</p>
    `,
  },
];

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}
