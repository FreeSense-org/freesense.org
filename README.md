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
public/_routes.json  invokes Pages Functions only for the two release documents
functions/           same-origin pass-throughs for the canonical release documents
src/layouts/         Base.astro (head, fonts, nav, footer)
src/components/       Nav.astro, Footer.astro
src/pages/
  index.astro        landing page
  download.astro     download page (reads the two canonical channel documents)
  license.astro      /license — Apache-2.0 + attribution (the GUI links here)
```

## Download page data

The download page fetches independent same-origin Stable and Development documents. Narrowly
routed Cloudflare Pages Functions pass through and validate the canonical documents published
at `pkg.freesense.org/v1/releases/stable.json` and `devel.json`, so releases appear without a
website rebuild. The OS release pipeline owns those files and publishes each channel only after
the ISO completion marker and KVM boot smoke pass. It uploads the verified installer to an
immutable object on `downloads.freesense.org` before updating the small channel document. This
repository contains no release metadata; the hourly workflow only verifies that the website
responses match the canonical documents.

Stable is the supported, immutable 1.0.x line. Necessary maintenance or security updates are
published as explicit patch releases such as 1.0.1. Development is the rolling 1.1 line: it is
experimental, intended for test and lab use, and has no support commitment. Stable and Development
are independent; publishing either document never overwrites the other.

## Deploy (Cloudflare Pages)

- Framework preset: **Astro**
- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`

## License

Site content © The FreeSense Project, Apache-2.0. FreeSense is an independent open-source
derivative of pfSense® CE; not affiliated with Netgate.
