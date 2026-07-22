<p align="center">
  <img src="public/brand/lockup-dark.svg#gh-dark-mode-only" height="44" alt="FreeSense" />
  <img src="public/brand/lockup-light.svg#gh-light-mode-only" height="44" alt="FreeSense" />
</p>

<p align="center"><strong>freesense.org</strong> — the FreeSense project website (landing + download).</p>

---

Static site built with [Astro](https://astro.build), deployed on **Cloudflare Pages** to
`freesense.org` / `www.freesense.org`.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview  # serve the built site
```

## Structure

```
public/brand/        logo lockups + icons (Space Grotesk, embedded)
public/favicon.svg   FS monogram favicon
public/_headers      Cloudflare Pages caching + security headers
src/layouts/         Base.astro (head, fonts, nav, footer)
src/components/       Nav.astro, Footer.astro
src/pages/
  index.astro        landing page
  download.astro     download page (reads public/releases.json at runtime)
  license.astro      /license — Apache-2.0 + attribution (the GUI links here)
```

## Download page data

The download page temporarily fetches `/releases.json` from this website. Update that file only
with an ISO whose public completion marker and KVM boot smoke have passed. A future release
publisher will replace this committed manifest with an automatically signed channel manifest.
Stable cards are displayed only when `support_tier` is `supported`.

```json
{
  "generated": "2026-07-11T12:00:00Z",
  "channels": {
    "devel": {
      "version": "1.1",
      "release_id": "1.1-g14",
      "display_name": "FreeSense 1.1 Development — Generation 14",
      "support_tier": "development",
      "iso": "...",
      "url": "...",
      "size": 0,
      "sha256": "...",
      "published_at": "...",
      "provenance": { "source": "...", "ports": "...", "os_definition": "...", "freebsd": "..." }
    }
  }
}
```

## Deploy (Cloudflare Pages)

- Framework preset: **Astro**
- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`

## License

Site content © The FreeSense Project, Apache-2.0. FreeSense is an independent open-source
derivative of pfSense® CE; not affiliated with Netgate.
