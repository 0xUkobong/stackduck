# Stackduck brand refresh

Primary choice: **image #2**, the ivory duck on navy. The mint stack remains distinctive and the face stays visible at small sizes. Image #1, navy on mint, remains the alternate campaign illustration.

## Applied to the app

- `public/logo-64-3d.png`, `logo-128-3d.png`, `logo-256-3d.png`: responsive app assets used by the shared `StackduckMark` component across navigation, authentication, footer, and app pages.
- `public/logo.png`, `logo-dark.png`: compatibility PNG exports of the primary identity.
- `public/logo.svg`, `logo-dark.svg`: self-contained SVG wrappers containing the 3D PNG, for existing SVG consumers. These are raster-based SVG wrappers, not infinitely scalable vector illustrations.
- `public/logo-wordmark*.svg` and `.png`: updated wordmark lockups.
- `public/favicon.svg`: a purpose-drawn small-size companion with the same ivory duck, amber beak, and ivory/mint stack. Detail is deliberately simplified for browser tabs.
- `public/favicon-16.png`, `favicon-32.png`, `favicon-48.png`, `favicon.png`, `favicon.ico`: raster and legacy favicon fallbacks.
- `public/apple-touch-icon.png`: 180-pixel touch icon.
- `public/og-image-3d.png` and `og-image.png`: refreshed 1200 × 630 cover artwork. Open Graph and X metadata point to the new versioned filename.

The 3D master is `public/brand/stackduck-3d-master.png`, with a genuinely transparent background. Built-in Image Gen removed the original scene background and refined its edges. See `IMAGE-PROMPTS.md` for the prompt set.

## Covers and social artwork

The existing brand-kit's embedded marks were replaced without rewriting its campaign copy or layouts. The coming-soon kit was regenerated using the updated primary mark, while keeping the original navy and mint campaign illustrations.

The new downloadable bundle contains `app-assets/` and `social-kit/`. Use the navy cover as the default and mint as an alternative.

## Reproduction

From the project root:

```powershell
node scripts/export-app-brand.mjs
node scripts/export-coming-soon-kit.mjs
```

Both use the project's Puppeteer dependency and a local Chrome installation. `CHROME_PATH` can override Chrome's location.

`brand-preview.png` compares the identity on light/dark surfaces and shows the favicon at 16/32 pixels and app marks at 64/128 pixels. Existing unrelated workspace edits are retained. This update has not been deployed or posted to social accounts.
