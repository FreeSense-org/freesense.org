// The Optional Packages of FreeSense 1.1 (34), grouped by the catalog category.
// Source: the package catalog page of the documentation (docs.freesense.org/packages/catalog/).
export interface Pkg { name: string; desc: string; doc: string }
export interface PkgGroup { key: string; label: string; items: Pkg[] }

export const packageGroups: PkgGroup[] = [
  {
    key: 'security', label: 'Security', items: [
      { name: 'Threat Shield & DNS Protection', doc: 'threat-shield', desc: 'Network-wide DNS filtering with AdGuard Home, IP threat lists, country blocking, inbound reputation checks and a live threat map.' },
      { name: 'Secure Web Gateway', doc: 'web-gateway', desc: 'Outbound web security gateway based on Squid 7: explicit and transparent proxying, TLS inspection modes, web policy, user authentication and logging.' },
      { name: 'Web Gateway Local Antivirus', doc: 'web-gateway', desc: 'Optional companion to the Secure Web Gateway that adds local malware scanning with ClamAV. Off until you enable it.' },
      { name: 'Suricata IDS/IPS', doc: 'suricata', desc: 'Network intrusion detection and prevention engine with ruleset management and event browsing.' },
      { name: 'CrowdSec', doc: 'crowdsec', desc: 'Behavior-based threat detection whose decisions are enforced through a FreeSense-managed firewall alias and rule.' },
      { name: 'ACME Certificates', doc: 'acme', desc: 'Automatically issues and renews certificates from ACME services such as Let\'s Encrypt.' },
    ],
  },
  {
    key: 'vpn', label: 'VPN', items: [
      { name: 'WireGuard', doc: 'wireguard', desc: 'Fast, modern site-to-site and remote-access VPN tunnels.' },
      { name: 'Tailscale', doc: 'tailscale', desc: 'Joins the firewall to a Tailscale mesh network, which is built on WireGuard.' },
      { name: 'ZeroTier', doc: 'zerotier', desc: 'ZeroTier network membership, with explicit consent for managed routes and DNS, plus interface and peer status.' },
      { name: 'OpenVPN Client Export', doc: 'openvpn-client-export', desc: 'Exports ready-to-use client configurations and bundles for the built-in OpenVPN servers.' },
    ],
  },
  {
    key: 'routing', label: 'Routing', items: [
      { name: 'FRRouting', doc: 'frr', desc: 'Dynamic routing daemons: BGP, OSPF, OSPFv3, RIP and BFD.' },
      { name: 'Multicast Bridge', doc: 'mcast-bridge', desc: 'Forwards IPv4 and IPv6 UDP multicast between interfaces, statically or on demand through IGMP and MLD.' },
      { name: 'UDP Broadcast Relay', doc: 'udpbroadcastrelay', desc: 'Relays UDP broadcast packets from one interface to others.' },
    ],
  },
  {
    key: 'services', label: 'Services', items: [
      { name: 'HAProxy', doc: 'haproxy', desc: 'TCP and HTTP(S) load balancer and reverse proxy with ACL-based backend selection.' },
      { name: 'BIND Authoritative DNS', doc: 'bind', desc: 'BIND DNS server for authoritative zones, with DNSSEC and DNS64 support.' },
      { name: 'Avahi Service Discovery', doc: 'avahi', desc: 'mDNS/DNS-SD (Bonjour) service discovery across LAN segments.' },
      { name: 'mDNS Bridge', doc: 'mdns-bridge', desc: 'Shares Multicast DNS information between interfaces so service discovery works across segments.' },
      { name: 'LLDP Service', doc: 'lldpd', desc: 'Announces and discovers neighbors with LLDP and related discovery protocols such as CDP.' },
      { name: 'TFTP Server', doc: 'tftpd', desc: 'TFTP server for network boot and device configuration files.' },
    ],
  },
  {
    key: 'authentication', label: 'Authentication', items: [
      { name: 'FreeRADIUS', doc: 'freeradius', desc: 'RADIUS server for network access authentication, with SQL, LDAP and Kerberos back ends.' },
    ],
  },
  {
    key: 'monitoring', label: 'Monitoring', items: [
      { name: 'ntopng Traffic Analysis', doc: 'ntopng', desc: 'Real-time traffic analysis with a web interface, flow inspection and traffic history.' },
      { name: 'Neighbor Watch', doc: 'andwatch', desc: 'Monitors ARP and IPv6 Neighbor Discovery, and reports when IP-to-MAC mappings change.' },
      { name: 'Traffic Totals', doc: 'traffic-totals', desc: 'Hourly, daily and monthly traffic totals per interface, using vnStat.' },
      { name: 'Flow Exporter', doc: 'softflowd', desc: 'Exports traffic flows as NetFlow to an external collector.' },
      { name: 'Prometheus Node Exporter', doc: 'node-exporter', desc: 'Exposes system metrics for Prometheus to scrape.' },
      { name: 'Telegraf', doc: 'telegraf', desc: 'Agent that collects system metrics and sends them to time-series databases.' },
      { name: 'SNMP Agent', doc: 'net-snmp', desc: 'Net-SNMP agent and trap daemon for SNMP-based monitoring.' },
      { name: 'syslog-ng', doc: 'syslog-ng', desc: 'A separate syslog server that receives, stores and forwards logs alongside the built-in logging.' },
      { name: 'Zabbix 7.0 Agent', doc: 'zabbix', desc: 'Zabbix agent that reports local metrics to a Zabbix server or proxy.' },
      { name: 'Zabbix 7.0 Proxy', doc: 'zabbix', desc: 'Zabbix proxy that collects monitoring data on behalf of a Zabbix server.' },
    ],
  },
  {
    key: 'system', label: 'System and diagnostics', items: [
      { name: 'Automation', doc: 'automation', desc: 'Scheduled commands and service-health watchdog, managed from one audited interface.' },
      { name: 'Network UPS Tools', doc: 'nut', desc: 'Monitors local USB or serial UPS units, and remote ones over SNMP, apcupsd or NUT, and shuts down cleanly.' },
      { name: 'Open VM Tools', doc: 'open-vm-tools', desc: 'VMware guest integration for FreeSense running as a VMware virtual machine.' },
      { name: 'Network Diagnostics', doc: 'diagnostics', desc: 'Allow-listed MTR, Nmap, iperf3 and ARP tools with strict input validation.' },
    ],
  },
];

export const packageCount = packageGroups.reduce((n, g) => n + g.items.length, 0);

// Threat Shield kiosk (full-screen wall display) styles, with the screenshot of each.
export const kioskStyles = [
  { key: 'freesense', label: 'FreeSense', src: '/packages/kiosk-freesense.webp' },
  { key: 'professional', label: 'Professional', src: '/packages/kiosk-professional.webp' },
  { key: 'hacker', label: 'Hacker', src: '/packages/kiosk-hacker.webp' },
  { key: 'light', label: 'Light', src: '/packages/kiosk-light.webp' },
];
