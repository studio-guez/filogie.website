# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Statamic 6 (flat-file CMS on Laravel 13, PHP 8.4) marketing site for Filogie, single-site, French only (`resources/sites.yaml`). Frontend is Antlers templates + Tailwind 4 + Alpine.js + Lenis, built with Vite. SQLite everywhere (local, CI, prod). See `README.md` for the full local setup and deployment story.

## Commands

Local dev runs inside Laravel Sail (Docker). Prefix everything with `./vendor/bin/sail` (or `sail` if aliased):

```bash
sail up -d                          # start containers (app on :80, Mailpit UI on :8025)
sail artisan ...                    # any artisan command (CP at /cp)
sail npm run dev                    # Vite dev server (HMR)
sail npm run build                  # production asset build
sail test                           # phpunit (all)
sail artisan test --filter=SomeTest # single test class/method
vendor/bin/pint --test              # lint check (CI runs this; fails on unformatted code)
vendor/bin/pint                     # auto-fix formatting
sail artisan statamic:stache:clear  # when content changes aren't picked up
./scripts/convert-images-to-webp.sh # host-side (needs ImageMagick); regenerates .webp + @1x for public/images
```

CI (`.github/workflows/ci.yml`) runs: `npm run build` → `vendor/bin/pint --test` → `php artisan test`. Pushes to `preprod`/`main` additionally build a Docker image (`docker/prod/Dockerfile`) and deploy via self-hosted runners. `deploy.md` is gitignored and contains legacy rsync commands for syncing content/storage with the servers.

## Architecture

### Content vs. config split (important for git)

`.gitignore` has `/content/*/*/`, which means:

- **Tracked**: collection/taxonomy/global/nav/asset-container *definitions* (`content/collections/pages.yaml`, `content/globals/footer.yaml`, …), all blueprints/fieldsets (`resources/blueprints`, `resources/fieldsets`), roles/groups (`resources/users`).
- **Untracked** (bind-mounted on servers, CP-editable): actual entries (`content/collections/pages/*.md`), localized global values (`content/globals/fr/*.yaml`), taxonomy terms, nav trees, and `users/`.

So a schema change (blueprint) is a code change and ships with the image; content changes never go through git. When adding a field, don't expect entries in the repo to be up to date — local entries are whatever was last rsynced.

### Collections and routing

- `pages` — the only routed collection (`{parent_uri}/{slug}`, structured tree). Each page picks a blueprint (`home`, `about_us`, `actions`, `news`, `page`); `template: '@blueprint'` means the blueprint handle selects `resources/views/pages/<handle>.antlers.html`. All pull SEO fields from the `seo_base` fieldset.
- `actions` and `news` — **no route, no own URLs**. They are dated entries rendered inline on the `nos-actions` / `diffusion` pages via `{{ collection:actions }}` / `{{ collection:news }}`, each tagged with a taxonomy (`actions_types`, `news_types`). Anchors (`#slug`, linked from the home page) use the entry slug, which is generated from the title. `php artisan filogie:migrate-slugs` backfills a title-based slug on legacy entries whose slug is still their id (content is rsynced to servers, not migrated on deploy).
- Sitemap is custom (`routes/web.php` → `SitemapController` → `resources/views/sitemaps/*.blade.php`) and only lists `pages` entries because the other collections have no URLs.

### Templates

- `resources/views/layout.antlers.html` wraps every page: SEO meta from `seo_base` fields, favicons generated through Glide presets from `global_site` assets, `noindex` when `APP_ENV !== production`.
- `partials/_asset.antlers.html` is the single image-rendering partial. It takes a `preset` name (`full`, `half`, `third`, `thumbnail`) and derives `<preset>_2x`, `<preset>_fallback`, `<preset>_fallback_2x` — these four variants must all exist in `config/statamic/assets.php` `presets` when adding a new size. Handles SVG/GIF/video passthrough.
- Decorative background shapes in `public/images` bypass Glide entirely: they're hand-placed `<img srcset="…@1x.webp 1x, ….webp 2x">` inside an `x-data="parallaxStack()"` container with `data-speed` per layer. The Alpine component lives in `resources/js/site.js` and polls `scrollY` in rAF (see comments there for why — don't switch it to scroll events).

### Styling

`resources/css/site.css` is Tailwind 4 CSS-first config: theme tokens in `@theme`, custom utilities (`container-main`, `container-content`, `px-base`, `text-title-lg`, `.bard` prose styles) in `@layer utilities`. Class names built dynamically in Antlers (e.g. `bg-actions-{{ color_slug }}-bg`, `bg-principles-{{ n }}`) are safelisted via `@source inline(...)` at the top of the file — add to that list if you introduce new dynamic class patterns. `color_slug` on `actions_types` terms is set directly in the term YAML, not exposed in the blueprint.

### Deployment constraints that affect code

- Production containers have no writable `.env`, no composer, no npm; assets are built in CI and baked into the image. Anything runtime-configurable must come from env vars read via `config/`.
- Caches (`config`, `route`, `view`, `event`, `statamic:stache:warm`) are warmed on deploy — code that relies on uncached config/env at runtime should go through `config()`.
- `FORCE_HTTPS` env → `URL::forceScheme('https')` in `AppServiceProvider` (TLS is terminated by a host-level reverse proxy outside this repo).
