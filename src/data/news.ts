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
    slug: 'freesense-1-1-10',
    date: '2026-10-21', // set to the seal date when 1.1.10 is published
    tag: 'Security',
    title: 'FreeSense 1.1.10: update now, two critical PHP vulnerabilities are fixed',
    summary:
      'A Stable security patch. PHP 8.5.12 fixes CVE-2026-109618 and CVE-2026-109619, two critical remote code execution flaws in PHP itself. It also hardens the WebUI, updates HAProxy to 3.4.7 and fixes two smaller problems.',
    link: { href: 'https://docs.freesense.org/releases/1.1.10/', label: 'Read the release notes' },
    body: `
      <p><strong>FreeSense 1.1.10</strong> is a Stable security patch. The PHP project fixed two critical
      vulnerabilities on 21 October 2026, and 1.1.10 ships the fixed PHP. <strong>Update promptly.</strong></p>
      <h2>The PHP vulnerabilities</h2>
      <ul>
        <li><strong><a href="https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w" rel="noopener">CVE-2026-109618</a></strong>:
        memory left in an invalid state when a request runs out of memory early, for example during a crafted
        multipart upload.</li>
        <li><strong><a href="https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp" rel="noopener">CVE-2026-109619</a></strong>:
        state left over from a finished request that a later request on the same worker can reach.</li>
      </ul>
      <p>The PHP project rates both as critical (CVSS 4.0 score 9.2) and says they can allow remote code execution
      without logging in. It says updating PHP is the only complete mitigation. The FreeSense WebUI runs PHP-FPM behind
      nginx; the PHP advisories describe a demonstrated exploit only for Apache's mod_php and say PHP-FPM is affected
      under some conditions, so do not rely on that. FreeSense 1.1.9 and earlier ship PHP 8.5.11, which is affected.</p>
      <p>Until you can update, do not expose the WebUI to the internet. Management access should be limited to
      trusted networks.</p>
      <p><strong>Development 1.2</strong> gets the same PHP 8.5.12 fix in its next build, expected tonight; until
      then it runs the affected PHP. Development is experimental and unsupported. <strong>FreeSense 1.0</strong> is
      frozen and receives no fix: upgrade to 1.1.10 (the upgrade is one-way, so read
      <a href="https://docs.freesense.org/guides/upgrading-from-1.0/">Upgrading from 1.0</a> first).</p>
      <h2>What else is in 1.1.10</h2>
      <ul>
        <li><strong>WebUI hardening</strong> from our security audit: XML-RPC code execution is limited to the admin
        user, captive portal file names and CSRF checks are tightened, disconnecting a client from the Captive Portal
        widget is a CSRF-checked POST, stored data is no longer unserialized into objects, and old password hashes are
        upgraded to bcrypt at the next login.</li>
        <li><strong>HAProxy 3.4.7</strong> (Optional package, from 3.4.2) fixes buffer overflows in JWT and JWE
        handling, HTTP/2 and HTTP/3 framing problems that could be used for request smuggling, and a number of crashes.</li>
        <li><strong>VXLAN</strong> multicast tunnels with a non-default local port work.</li>
        <li><strong>Cloud images</strong> keep an administrator's password when the cloud configuration is applied again.</li>
      </ul>
      <h2>How to update</h2>
      <p>Systems on 1.1.0, 1.1.5 and 1.1.9 update from System &rarr; Update as usual; update the Optional Packages
      afterwards so HAProxy gets its fix. Systems on 1.1.1 to 1.1.4 need
      <a href="https://docs.freesense.org/releases/1.1.9/#before-you-update-from-111-to-114">one console command</a>
      first. Every release is upgrade-tested on a virtual machine before it is published. FreeSense 1.1.9 is not
      withdrawn; it works, but it carries the vulnerable PHP.</p>
      <p><a href="/download">Download FreeSense 1.1.10</a> or read the
      <a href="https://docs.freesense.org/releases/1.1.10/">full release notes</a>. The advisories that apply to each
      release are listed on <a href="https://security.freesense.org/all/?version=1.1" rel="noopener">security.freesense.org</a>.</p>
    `,
  },
  {
    slug: 'fleet-self-hosted',
    date: '2026-10-19',
    tag: 'Development',
    title: 'FreeSense Fleet is self-hosted: no cloud, no account, all yours',
    summary:
      "Fleet is not a cloud service. The controller is a FreeSense system you run, your data stays on it, and nothing is sent to FreeSense.",
    image: '/fleet/fleet-dashboard.png',
    imageAlt: 'The FreeSense Fleet dashboard showing seven firewalls online',
    link: { href: '/fleet/', label: 'See FreeSense Fleet' },
    body: `
      <p>Central management usually means a vendor's cloud: you create an account, your firewalls call a service you
      do not run, and your fleet is only as private as that service. <strong>FreeSense Fleet works the other way
      round.</strong> It is self-hosted by design, and it is not a cloud service.</p>
      <h2>What that means</h2>
      <ul>
        <li><strong>No Fleet cloud and no account.</strong> There is no FreeSense-hosted service to sign up for, and no subscription.</li>
        <li><strong>Your data stays on your controller.</strong> The inventory, history, alerts, backups, policies and keys live on the controller. Removing the package does not delete the fleet.</li>
        <li><strong>Nothing is sent to FreeSense.</strong> Fleet makes no connection to FreeSense servers. The invitation points at your controller, and each firewall pins its certificate.</li>
        <li><strong>Encrypted and authenticated.</strong> Firewalls reach the controller over the Fleet WireGuard tunnel, a tailnet, or directly. A firewall joins with your invitation and a 6-digit approval code that you compare on both screens.</li>
        <li><strong>Third parties only if you choose them.</strong> Tailscale is one way to connect, and alerts can go to email, a webhook, Slack or Teams, Telegram, ntfy or Gotify. Fleet works without any of them.</li>
      </ul>
      <h2>Run the controller wherever you want</h2>
      <p>The controller is an ordinary FreeSense system, so you decide where it lives: on your own network, on your own
      server, or inside a tailnet. You can also deploy it from a FreeSense
      <a href="/download/?image=ufs&amp;format=qcow2">cloud image</a> on a server or cloud account that you own, give it a
      public address, and manage your fleet from that secure site. It is still your server and your data, and the
      project runs nothing. Firewalls open the connection to the controller, so only the controller has to be reachable.</p>
      <h2>How it compares</h2>
      <p>The <a href="/compare/#central">Compare page</a> now sets Fleet next to the central managers of pfSense Plus,
      OPNsense, Sophos and UniFi, using only what their own documentation says.</p>
      <h2>Status</h2>
      <p>Fleet is part of the Development line (FreeSense 1.2). It is experimental and not in Stable 1.1, so do not manage
      production firewalls with it yet. Read the
      <a href="https://docs.freesense.org/1.2/configure/fleet/">documentation</a> and the
      <a href="https://docs.freesense.org/1.2/configure/fleet-status/">status page</a> for what was tested.</p>
    `,
  },
  {
    slug: 'security-site',
    date: '2026-10-18',
    tag: 'Security',
    title: 'security.freesense.org: every FreeBSD advisory, and what it means for FreeSense',
    summary:
      "A new site lists every FreeBSD security advisory since 2025 with a decision for FreeSense 1.0, 1.1 and 1.2, and FreeSense's own bugs and issues next to them.",
    link: { href: 'https://security.freesense.org/', label: 'Open the security site' },
    body: `
      <p>FreeSense is built on FreeBSD, so FreeBSD's security advisories matter to us. The new
      <a href="https://security.freesense.org/">security site</a> lists every one of them since 2025 and says what it
      means for each FreeSense version.</p>
      <h2>Open, fixed or not relevant</h2>
      <p>Every advisory has a status for <strong>FreeSense 1.0, 1.1 and 1.2</strong>:</p>
      <ul>
        <li><strong>Open</strong>: it applies to code we build, and the fix is not in the FreeBSD snapshot that version builds from yet.</li>
        <li><strong>Fixed</strong>: FreeBSD corrected it before that snapshot.</li>
        <li><strong>Not relevant</strong>: it is about code FreeSense does not build or ship. The page names the evidence from our build configuration.</li>
      </ul>
      <p>Each advisory has its own page with the CVE IDs, the affected FreeBSD releases, the correction dates and any
      workaround, and links to the original FreeBSD advisory. FreeSense 1.0 is frozen, so an advisory that is open on 1.0
      stays open there; the fix is to update to 1.1.</p>
      <h2>Bugs and issues, too</h2>
      <p>FreeSense's own bugs and issues from GitHub are listed in the same place, each with a badge: Bug, Security
      report or Issue. Open and closed ones are both shown.</p>
      <h2>An honest note on the statuses</h2>
      <p>Most statuses are decided automatically, by comparing the date FreeBSD corrected an advisory with the date of the
      FreeBSD source each version is pinned to, and they are marked <em>auto</em> until a maintainer reviews them. They
      do not tell you whether your own system is exposed: a bug in a kernel module only matters if the module is loaded.
      FreeBSD advisories carry no severity score, so we do not invent one. The
      <a href="https://security.freesense.org/triage/">triage page</a> explains the method and its limits.</p>
      <p>For now the site covers the FreeBSD base system and FreeSense's GitHub issues. Advisories for ports and the
      optional packages are planned next.</p>
      <h2>Report a vulnerability</h2>
      <p>Found a security problem in FreeSense? Please report it
      <a href="https://security.freesense.org/report/">privately</a> so we can fix it before it is public.</p>
    `,
  },
  {
    slug: 'freesense-fleet-preview',
    date: '2026-10-18',
    tag: 'Development',
    title: 'FreeSense Fleet: manage every firewall from one place (1.2 preview)',
    summary:
      'Fleet is central management for FreeSense: guided joining, a live dashboard and wall-screen view, updates in rings, policies, backups and HA pairs. Available now in the Development build.',
    image: '/fleet/fleet-dashboard.png',
    imageAlt: 'The FreeSense Fleet dashboard showing seven firewalls online with a 24-hour pulse grid',
    link: { href: 'https://docs.freesense.org/1.2/configure/fleet/', label: 'Read the Fleet documentation' },
    body: `
      <p><strong>FreeSense Fleet</strong> is the first big feature of the 1.2 line. One firewall runs the Fleet controller
      (the optional package <code>FreeSense-pkg-Fleet</code>); every other firewall joins it with the agent that is part
      of FreeSense itself. Firewalls open the connection, so they can sit behind NAT.</p>
      <h2>What you get</h2>
      <ul>
        <li><strong>Guided joining:</strong> make an invitation, paste it into <em>Add to fleet</em> on the new firewall
        and compare a 6-digit code before you approve. Use the Fleet tunnel, Tailscale or a direct connection.</li>
        <li><strong>A live dashboard and a wall-screen view</strong> with groups, 24-hour availability, alerts and
        internet quality for every firewall.</li>
        <li><strong>Updates in rings</strong> with maintenance windows, rolling reboots, templates and schedules.</li>
        <li><strong>Policies</strong> that audit, fix or lock settings on every firewall.</li>
        <li><strong>HA pairs</strong> set up from two firewalls in a step-by-step guide, with an optional encrypted link.</li>
        <li><strong>Backups</strong> of every firewall, kept on the controller.</li>
      </ul>
      <h2>How far it has been tested</h2>
      <p>In our lab, one controller managed seven firewalls (one of them over Tailscale). A three-ring update of all
      seven took 20 minutes, and an HA pair failed over within seconds when its MASTER lost power. The
      <a href="https://docs.freesense.org/1.2/configure/fleet-status/">status page</a> lists what was tested and what has not
      been proven yet.</p>
      <h2>Development only</h2>
      <p>Fleet is part of the Development line, is experimental and unsupported, and is <strong>not in Stable 1.1</strong>.
      Do not manage production firewalls with it yet. Installed Development systems receive it with the nightly build;
      the controller is installed from <em>System &rarr; Package Manager</em>.</p>
    `,
  },
  {
    slug: 'freesense-1-1-9',
    date: '2026-10-17',
    tag: 'Release',
    title: 'FreeSense 1.1.9: RADIUS works again, plus hardening and PHP 8 fixes',
    summary:
      'A Stable patch release: RADIUS logins work again, older boot environments are locked in the WebUI, PHP 8 warnings are cleared across the WebUI and Optional Packages, and serial-console installs work.',
    link: { href: 'https://docs.freesense.org/releases/1.1.9/', label: 'Read the release notes' },
    body: `
      <p><strong>FreeSense 1.1.9</strong> is the new Stable release. It follows 1.1.5 and collects the fixes made on
      the 1.1 line since then. The numbers 1.1.6 to 1.1.8 were test builds that were withdrawn before release and
      never published; everything in them is part of 1.1.9.</p>
      <h2>What's new</h2>
      <ul>
        <li><strong>RADIUS logins work again.</strong> Logins through a RADIUS server failed on 1.1.0 to 1.1.5, for
        the WebUI, VPN users and Captive Portal. The RADIUS client was rewritten for PHP 8.5 and supports PAP,
        CHAP-MD5, MS-CHAPv1 and MS-CHAPv2.</li>
        <li><strong>Safer boot environments.</strong> System &rarr; Boot Environments no longer activates a boot
        environment that holds an older release such as 1.0.</li>
        <li><strong>Cleaner under the hood.</strong> PHP 8 fixes on every WebUI page and in the Optional Packages.
        A full crawl of the WebUI with every PHP warning turned on went from about 1,000 warnings to a few
        harmless notices. The fixed packages get new versions, so the Package Manager offers them.</li>
        <li><strong>Security hardening</strong> in the firewall rule editor and the LDAP container lookup, and an
        unused JavaScript library with a known CVE is removed.</li>
        <li><strong>Serial-console installs</strong> no longer stop at the ZFS step.</li>
      </ul>
      <h2>How to update</h2>
      <p>Systems on 1.1.0 and 1.1.5 update from System &rarr; Update as usual; update the Optional Packages
      afterwards. Systems on 1.1.1 to 1.1.4 need
      <a href="https://docs.freesense.org/releases/1.1.9/#before-you-update-from-111-to-114">one console command</a>
      first. Every release is upgrade-tested on a virtual machine before it is published.</p>
      <p><a href="/download">Download FreeSense 1.1.9</a> or read the
      <a href="https://docs.freesense.org/releases/1.1.9/">full release notes</a>. Older notes are on
      <a href="https://docs.freesense.org/releases/previous-1.1/">Previous 1.1 releases</a>.</p>
    `,
  },
  {
    slug: 'freesense-1-1-5',
    date: '2026-10-14',
    tag: 'Release',
    title: 'FreeSense 1.1.5: updates and package changes work again',
    summary:
      'A Stable hotfix for 1.1.1 to 1.1.4, where system updates and package installs stopped with "Another instance of FreeSense-upgrade is running". Those systems need one console command first.',
    link: { href: 'https://docs.freesense.org/releases/previous-1.1/#freesense-115', label: 'Read the release notes' },
    body: `
      <p><strong>FreeSense 1.1.5</strong> is a Stable hotfix. On 1.1.1 to 1.1.4 every system update and every
      package install, update, reinstall and removal stopped with &ldquo;Another instance of FreeSense-upgrade is
      running&rdquo;, because the updater lost the update channel you selected. 1.1.5 fixes the updater and brings
      Threat Shield 1.1.0 from 1.1.4.</p>
      <h2>Before you update from 1.1.1 to 1.1.4</h2>
      <p>The broken updater on those systems cannot install the fix by itself. Open a shell once (console option 8,
      or SSH), run the command from the
      <a href="https://docs.freesense.org/releases/1.1.9/#before-you-update-from-111-to-114">1.1.5 release notes</a>,
      then update from System &rarr; Update as usual. Systems on 1.1.0 update normally.</p>
      <h2>What's new</h2>
      <ul>
        <li><strong>Updates work again</strong>, for the system and for Optional Packages.</li>
        <li><strong>The update window opens at once.</strong> System updates and package changes show live
        progress, what the updater is doing and the elapsed time, and say so clearly when another update is
        running.</li>
        <li><strong>Threat Shield</strong> saves reliably, and the threat map and health checks no longer show a
        security-token warning page.</li>
        <li>The login page shows the FreeSense version (you can hide it under System &rarr; General Setup), and
        package versions read <code>1.1</code> instead of <code>1.1_8</code>.</li>
      </ul>
      <p><a href="/download">Download FreeSense 1.1.5</a> or read the
      <a href="https://docs.freesense.org/releases/previous-1.1/#freesense-115">full release notes</a>.</p>
    `,
  },
  {
    slug: 'freesense-1-1-stable',
    date: '2026-10-13',
    tag: 'Release',
    title: 'FreeSense 1.1 is the new Stable release',
    summary:
      'FreeSense 1.1.0 replaces 1.0 as the supported line, with a REST API, custom package repositories, a rebuilt Package Manager, a reworked WebUI, VXLAN, and encrypted remote backups.',
    link: { href: 'https://docs.freesense.org/releases/previous-1.1/#freesense-110', label: 'Read the release notes' },
    body: `
      <p><strong>FreeSense 1.1.0</strong> is now the Stable release, and it replaces 1.0.x as the supported line.
      The 1.0.x downloads stay published, but ordinary fixes now land in 1.1. Development moves on to the rolling
      <strong>1.2</strong> line.</p>
      <h2>What's new</h2>
      <ul>
        <li><strong>REST API.</strong> Version 1 of the FreeSense REST API, with per-user privileges and a built-in
        API Explorer. <a href="https://docs.freesense.org/api/overview/">API documentation</a></li>
        <li><strong>Custom package repositories.</strong> Add your own repositories under System &rarr; Package Manager.
        They always rank below the official FreeSense repositories, and the system upgrader never uses them.
        <a href="https://docs.freesense.org/packages/custom-repositories/">Guide</a></li>
        <li><strong>A rebuilt Package Manager</strong> with filters, a source column, and a review step before
        anything is installed or removed.</li>
        <li><strong>A reworked WebUI.</strong> Grouped top menus, Ctrl+K menu search, and rebuilt pages across the
        base system and packages.</li>
        <li><strong>VXLAN interfaces</strong>, plus new link speed and duplex settings for network interfaces.</li>
        <li><strong>Encrypted remote configuration backups</strong> to S3-compatible storage, WebDAV, or SFTP.</li>
        <li><strong>Threat Shield &amp; DNS Protection</strong>, a new optional package for DNS filtering
        with AdGuard Home. pfBlockerNG has been removed from the catalog; the upgrade guide explains what replaces
        each part of it.</li>
        <li><strong>Security fixes</strong> for the upstream advisories SA-26_05 to SA-26_21, and further hardening
        found by code scanning.</li>
      </ul>
      <p>The full list is in the <a href="https://docs.freesense.org/releases/previous-1.1/#freesense-110">1.1.0 release notes</a>, and
      <a href="https://docs.freesense.org/releases/whats-new-1.1/">What's new in 1.1</a> walks through each feature.</p>
      <h2>Upgrading from 1.0</h2>
      <p>Existing 1.0 systems upgrade in place from the console or the WebUI. The upgrade is one-way: once a system
      runs 1.1, the updater never offers 1.0 again. Back up your configuration first, and check whether you use a
      package that changed, such as pfBlockerNG. The
      <a href="https://docs.freesense.org/guides/upgrading-from-1.0/">upgrade guide</a> covers the details,
      including how ZFS boot environments behave during the upgrade.</p>
      <h2>Platforms</h2>
      <p>Stable 1.1.0 was published for amd64, as an installer ISO and as UFS and ZFS cloud images.
      <strong>Stable 1.1.1</strong> follows from the same sources and adds generic ARM64 (UEFI): an installer image
      plus ARM64 System and Optional Packages. There are no ARM64 cloud images, and the Raspberry Pi appliance images
      stay on the Development line. <a href="https://docs.freesense.org/releases/previous-1.1/#freesense-111">1.1.1 release notes</a></p>
      <h2>Known issues</h2>
      <ul>
        <li>On 1.1.0 the dashboard shows the current time as the build time. This is cosmetic and fixed in
        1.1.1.</li>
        <li>In one upgrade test, the Secure Web Gateway service was stopped after the reboot. It started normally by
        hand. If you use it, check that it is running after you upgrade.</li>
      </ul>
      <p><a href="/download">Download FreeSense 1.1</a> or read the
      <a href="https://docs.freesense.org/">updated documentation</a>.</p>
    `,
  },
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
