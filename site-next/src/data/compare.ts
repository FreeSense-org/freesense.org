// Comparison of FreeSense with other self-hosted firewall and router platforms.
// Every non-FreeSense value is backed by the product's `source`; "—" means we could not verify it.
export const REVIEWED = '2026-10';

export type Group = 'open' | 'commercial' | 'appliance';

export interface Product {
  id: string;
  name: string;
  vendor: string;
  groups: Group[];
  values: Record<string, string>;
  chooseIf: string;
  source: { label: string; href: string }[];
}

export const groupLabels: Record<Group, string> = {
  open: 'Open source',
  commercial: 'Commercial',
  appliance: 'Vendor appliance',
};

export const rows: { key: string; label: string }[] = [
  { key: 'model', label: 'Source model' },
  { key: 'license', label: 'License' },
  { key: 'base', label: 'Base OS' },
  { key: 'filter', label: 'Packet filter' },
  { key: 'cost', label: 'Cost' },
  { key: 'account', label: 'Vendor account needed' },
  { key: 'hardware', label: 'Runs on' },
  { key: 'api', label: 'REST API' },
  { key: 'wireguard', label: 'WireGuard' },
  { key: 'ids', label: 'IDS / IPS' },
  { key: 'ha', label: 'High availability' },
  { key: 'central', label: 'Central management' },
  { key: 'support', label: 'Commercial support' },
  { key: 'builds', label: 'Public CI builds' },
];

export const products: Product[] = [
  {
    id: 'freesense', name: 'FreeSense', vendor: 'FreeSense project', groups: ['open'],
    values: {
      model: 'Open source', license: 'Apache-2.0', base: 'FreeBSD 16', filter: 'pf', cost: 'Free',
      account: 'No', hardware: 'Your x86-64 hardware, VMs, cloud images (arm64 in Development)',
      api: 'Built in, with API Explorer', wireguard: 'Package', ids: 'Suricata package', ha: 'CARP',
      central: 'Fleet (1.2, planned early 2027): Direct, Fleet WireGuard or Tailscale', support: 'Community only', builds: 'Yes, public and signed',
    },
    chooseIf: 'you want a fully open pf firewall with no accounts or telemetry and builds you can trace to source, and you can live with a young project that has community support only.',
    source: [{ label: 'FreeSense documentation', href: 'https://docs.freesense.org' }],
  },
  {
    id: 'pfsense-ce', name: 'pfSense CE', vendor: 'Netgate', groups: ['open'],
    values: {
      model: 'Open source', license: 'Apache-2.0', base: 'FreeBSD', filter: 'pf', cost: 'Free',
      account: '—', hardware: 'Your x86-64 hardware', api: 'Third-party package', wireguard: 'Package',
      ids: 'Snort / Suricata packages', ha: 'CARP, two-node clusters', central: 'No (Nexus is for pfSense Plus)', support: 'Paid support is for Plus',
      builds: '—',
    },
    chooseIf: 'you want the most widely documented pf firewall, with years of guides, forum answers and packages. FreeSense started from it.',
    source: [
      { label: 'Netgate: pfSense software types', href: 'https://www.netgate.com/pfsense-plus-software/software-types' },
      { label: 'Netgate docs: High Availability', href: 'https://docs.netgate.com/pfsense/en/latest/highavailability/index.html' },
    ],
  },
  {
    id: 'pfsense-plus', name: 'pfSense Plus', vendor: 'Netgate', groups: ['commercial', 'appliance'],
    values: {
      model: 'Closed source', license: 'EULA', base: 'FreeBSD', filter: 'pf',
      cost: 'From $129 per instance per year on your own hardware; included with Netgate appliances',
      account: '—', hardware: 'Netgate appliances, your x86-64 hardware, AWS, Azure', api: '—', wireguard: 'Package',
      ids: 'Snort / Suricata packages', ha: 'CARP, two-node clusters', central: 'Netgate Nexus, licensed per managed device', support: 'Netgate TAC (Lite, Pro, Enterprise)',
      builds: 'No',
    },
    chooseIf: 'you want pfSense with a vendor behind it: tested appliances, newer features first and paid support with response times.',
    source: [
      { label: 'Netgate docs: Nexus', href: 'https://docs.netgate.com/pfsense/en/latest/nexus/index.html' },
      { label: 'Netgate: pfSense software types', href: 'https://www.netgate.com/pfsense-plus-software/software-types' },
    ],
  },
  {
    id: 'opnsense', name: 'OPNsense', vendor: 'Deciso', groups: ['open'],
    values: {
      model: 'Open source', license: 'BSD-2-Clause', base: 'FreeBSD (formerly HardenedBSD)', filter: 'pf',
      cost: 'Free; optional Business Edition subscription', account: 'No', hardware: 'Your x86-64 hardware, Deciso appliances',
      api: 'Built in', wireguard: 'Built in', ids: 'Suricata, built in', ha: 'CARP',
      central: 'OPNcentral (Business Edition)', support: 'Deciso and partners', builds: '—',
    },
    chooseIf: 'you want a mature, fully open pf firewall with a large plugin set, built-in WireGuard and Suricata, and a company offering commercial support.',
    source: [
      { label: 'Thomas-Krenn: OPNsense Business Edition', href: 'https://www.thomas-krenn.com/en/wiki/OPNsense_Business_Edition' },
      { label: 'OPNsense documentation', href: 'https://docs.opnsense.org/' },
      { label: 'Thomas-Krenn: OPNsense release information', href: 'https://www.thomas-krenn.com/en/wiki/OPNsense_Release_Information' },
    ],
  },
  {
    id: 'routeros', name: 'MikroTik RouterOS', vendor: 'MikroTik', groups: ['commercial', 'appliance'],
    values: {
      model: 'Closed source', license: 'Per-device license levels', base: 'Linux-based', filter: 'RouterOS firewall',
      cost: 'Included with MikroTik hardware; CHR VM: free tier capped at 1 Mbps upload, paid tiers $45–$250',
      account: 'For CHR trials', hardware: 'MikroTik hardware, Cloud Hosted Router (VM)', api: 'Built in (RouterOS v7)',
      wireguard: 'Built in (RouterOS v7)', ids: '—', ha: 'VRRP', central: '—', support: 'MikroTik and consultants', builds: 'No',
    },
    chooseIf: 'you want inexpensive, capable routing hardware with deep routing features (BGP, OSPF, MPLS) and are comfortable with its own CLI and configuration model.',
    source: [
      { label: 'MikroTik: CHR licensing', href: 'https://manual.mikrotik.com/docs/7.25/getting-started/routeros-licensing/chr/chr-licensing' },
      { label: 'MikroTik: RouterOS license keys', href: 'https://help.mikrotik.com/docs/display/ROS/RouterOS+license+keys' },
    ],
  },
  {
    id: 'openwrt', name: 'OpenWrt', vendor: 'OpenWrt project', groups: ['open'],
    values: {
      model: 'Open source', license: 'GPL and others', base: 'Linux', filter: 'nftables (firewall4)', cost: 'Free',
      account: 'No', hardware: 'About 2,000 consumer routers, x86, ARM boards', api: '—', wireguard: 'Package',
      ids: '—', ha: '—', central: '—', support: 'Community', builds: '—',
    },
    chooseIf: 'you want to give an existing home router or small ARM board open firmware, often with Wi-Fi built in.',
    source: [
      { label: 'OpenWrt 24.10 release notes', href: 'https://openwrt.org/releases/24.10/notes-24.10.0' },
      { label: 'OpenWrt: firewall4 package', href: 'https://openwrt.org/packages/pkgdata/firewall4' },
    ],
  },
  {
    id: 'ipfire', name: 'IPFire', vendor: 'IPFire project', groups: ['open'],
    values: {
      model: 'Open source', license: 'GPL', base: 'Linux', filter: 'Linux netfilter', cost: 'Free', account: 'No',
      hardware: 'Your x86-64 hardware, ARM boards', api: '—', wireguard: 'Built in', ids: 'Suricata, built in', ha: '—',
      central: '—', support: 'Community', builds: '—',
    },
    chooseIf: 'you prefer a Linux-based firewall with a long track record, a built-in Suricata IPS and frequent core updates.',
    source: [
      { label: 'IPFire', href: 'https://www.ipfire.org/' },
      { label: 'Help Net Security: IPFire Core Update 200', href: 'https://www.helpnetsecurity.com/2026/03/02/pfire-2-29-core-update-200-released/' },
    ],
  },
  {
    id: 'vyos', name: 'VyOS', vendor: 'VyOS Networks', groups: ['open', 'commercial'],
    values: {
      model: 'Open source', license: 'GPLv2 / LGPLv2', base: 'Linux (Debian)', filter: 'Linux netfilter',
      cost: 'Rolling images free; LTS images by subscription', account: 'For LTS images',
      hardware: 'Your x86-64 hardware, VMs, cloud', api: 'Built in (HTTP API)', wireguard: 'Built in', ids: '—',
      ha: 'VRRP', central: '—', support: 'VyOS Networks subscriptions', builds: '—',
    },
    chooseIf: 'you think in routers more than firewalls: CLI-first, scriptable, strong on BGP and VPN, and comfortable building LTS from source or subscribing.',
    source: [
      { label: 'VyOS: get images', href: 'https://vyos.net/get' },
      { label: 'VyOS blog: release model', href: 'https://blog.vyos.io/vyos-release-model-change' },
    ],
  },
  {
    id: 'sophos', name: 'Sophos Firewall Home', vendor: 'Sophos', groups: ['commercial'],
    values: {
      model: 'Closed source', license: 'Free home-use license', base: '—', filter: '—',
      cost: 'Free for home use; limited to 4 CPU cores', account: '—', hardware: 'A dedicated Intel-compatible PC',
      api: '—', wireguard: '—', ids: 'Built in', ha: '—', central: 'Sophos Central', support: 'Community forum only', builds: 'No',
    },
    chooseIf: 'you want a commercial next-gen firewall feature set (web filtering, IPS, anti-malware) at home for free, within its core limit.',
    source: [{ label: 'Sophos: Central management for Sophos Firewall', href: 'https://www.sophos.com/en-us/blog/new-sophos-central-management-and-reporting-for-xg-firewall' }, { label: 'Sophos: Firewall Home Edition', href: 'https://www.sophos.com/en-us/free-tools/sophos-xg-firewall-home-edition' }],
  },
  {
    id: 'unifi', name: 'UniFi Gateway', vendor: 'Ubiquiti', groups: ['commercial', 'appliance'],
    values: {
      model: 'Closed source', license: 'Proprietary', base: '—', filter: '—', cost: 'Hardware purchase',
      account: '—', hardware: 'Ubiquiti gateways and consoles only', api: '—', wireguard: 'Built in (server)',
      ids: 'Built in', ha: '—', central: 'UniFi Site Manager, no license fee', support: 'Ubiquiti', builds: 'No',
    },
    chooseIf: 'you already run UniFi switches and access points and want one polished controller for the whole network.',
    source: [{ label: 'Ubiquiti help: Remote management via Site Manager', href: 'https://help.ui.com/hc/en-us/articles/20680072882967-UniFi-Remote-Management-via-Site-Manager' }, { label: 'Ubiquiti: UniFi cloud gateways', href: 'https://ui.com/cloud-gateways' }],
  },
  {
    id: 'fortigate', name: 'FortiGate', vendor: 'Fortinet', groups: ['commercial', 'appliance'],
    values: {
      model: 'Closed source', license: 'Proprietary', base: 'FortiOS', filter: 'FortiOS',
      cost: 'Appliance or VM license plus FortiGuard subscriptions', account: 'FortiCare account for the VM trial',
      hardware: 'Fortinet appliances, VMs, cloud', api: 'Built in', wireguard: '—', ids: 'Built in (FortiGuard subscription)',
      ha: 'Built in', central: 'FortiManager / FortiManager Cloud', support: 'Fortinet and partners', builds: 'No',
    },
    chooseIf: 'you need an enterprise firewall with dedicated security hardware, central management and a large vendor support organisation.',
    source: [
      { label: 'Fortinet docs: FortiManager Cloud', href: 'https://docs.fortinet.com/document/forticloud/22.4.0/forticloud-concept-guide/624067/fortimanager-cloud' },
      { label: 'Fortinet docs: FortiGate-VM permanent trial', href: 'https://docs.fortinet.com/document/fortigate/7.4.6/administration-guide/441460' },
    ],
  },
];

export const notes = [
  {
    text: 'Untangle NG Firewall is now Arista Edge Threat Management. Arista ended sales of its Q-series NG Firewall appliances on 30 June 2026 and points customers to software editions or VeloCloud Edge, so it is not in the table.',
    source: { label: 'Arista: End of Sale of the ETM NG Firewall Q Series', href: 'https://www.arista.com/en/support/advisories-notices/end-of-sale/23673-end-of-sale-of-the-arista-edge-threat-management-ng-firewall-q-series-appliances' },
  },
];
