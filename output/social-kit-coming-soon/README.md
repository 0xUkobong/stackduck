# Stackduck / Coming soon social kit

Ready-to-upload PNG graphics, JPEG alternatives, editable HTML sources, and original illustration assets.

Brand account: **@StackduckApp** · Website: **https://stackduck.app** · Developer credit: **Built by @0xUkobong**

## Start here

1. Open `index.html` in a browser to browse the kit, or open `kit-preview.png` for the contact sheet.
2. Use `01-profile-navy-400.png` as your X profile picture.
3. Use `03-x-header-navy.png` as your X header.
4. Attach `04-pinned-post-navy.png` to the pinned post in `SOCIAL-COPY.md`.
5. Use the mint versions as follow-up campaign posts, or as your alternative header/cover direction.

These are new campaign assets in a separate folder; the earlier brand kit and live application were not replaced. All assets are prelaunch: there is no invented launch date, live waitlist, pricing offer, or performance promise. Nothing has been published to social accounts.

## Files and placements

| File stem | Dimensions | Use |
| --- | --- | --- |
| `01-profile-navy-400` | 400 × 400 | Primary X profile picture; circular-crop room |
| `01-profile-navy-1024` | 1024 × 1024 | High-resolution profile / community avatar |
| `02-profile-mint-400` | 400 × 400 | Mint profile alternative |
| `02-profile-3d-400` | 400 × 400 | 3D mascot profile alternative |
| `03-x-header-navy` / `03-x-header-mint` | 1500 × 500 | X header alternatives |
| `04-pinned-post-navy` / `04-pinned-post-mint` | 1600 × 900 | Pinned post / coming-soon announcement |
| `05-feed-square-navy` / `05-feed-square-mint` | 1080 × 1080 | Square social post |
| `06-feed-portrait` | 1080 × 1350 | Portrait post; carousel slide 1 |
| `07-story-coming-soon` | 1080 × 1920 | Story / vertical teaser cover |
| `08-link-preview` | 1200 × 630 | Manual link / press preview; site metadata is unchanged |
| `09-linkedin-personal-header` | 1584 × 396 | Personal LinkedIn background; not company-page artwork |
| `10-youtube-banner` | 2560 × 1440 | YouTube channel banner |
| `11-carousel-02-workflow` | 1080 × 1350 | Carousel slide 2: workflow |
| `12-carousel-03-follow` | 1080 × 1350 | Carousel slide 3: follow for launch |

Every row has PNG and editable HTML. Non-profile graphics also have JPEG alternatives. Keep the `assets` directory beside the HTML files when editing or moving them. `manifest.json` lists dimensions and intended uses.

## Suggested carousel order

1. `06-feed-portrait.png`
2. `11-carousel-02-workflow.png`
3. `12-carousel-03-follow.png`

## Upload checks

- X recommends 400 × 400 profiles and 1500 × 500 headers. Its upload preview can crop the top/bottom of a header; essential text is inset and away from the lower-left avatar overlap. Check the final preview on your own profile.
- All profile exports are below X's 2 MB profile-image limit.
- Story text is inset from the top and bottom; sticker/caption overlays vary by app, so check before posting.
- YouTube's essential content is centered in a 1546 × 423 band; the surrounding navy extends across the full canvas.
- A PNG can be uploaded directly. Use its JPEG alternative if a platform prefers a smaller file.

X guidance: https://help.x.com/en/managing-your-account/common-issues-when-uploading-profile-photo

## Editing and reproducing

Open any matching `.html` file in a text editor to change copy. Font and illustration files are local, so no external font service is required. The ivory 3D duck on navy is now the primary profile and app logo; the full navy/mint scenes remain campaign imagery. The high-resolution profile source is `assets/logo-profile.png`.

From the Stackduck project root, regenerate the graphics with:

```powershell
node scripts/export-coming-soon-kit.mjs
```

This requires the project's `puppeteer-core` dependency and Chrome. Set `CHROME_PATH` if Chrome is installed elsewhere. The exporter rewrites this campaign's HTML/PNG/JPG outputs, so make lasting layout changes in the exporter first.

## Art direction and provenance

- Primary reference: the existing Stackduck logo, established brand kit, and application design system.
- Locked palette: navy `#151b31`, mint `#A8DCC4`, ivory `#f2f2f2`, amber `#F5BA67` for the beak.
- Typography: local Open Runde, using 400, 600, and 700 weights. License included in `assets/font-license.txt`.
- Illustration: two new 3D duck renders generated with the built-in Image Gen tool; original PNGs are in `assets/`. Full generation prompts are in `ART-DIRECTION.md`.
- Layout: separately composed for each format, with exact editable text rather than generated lettering. No fake dashboard metrics are used.
- Design research: existing Stackduck product/brand references plus Refero's bundled typography and anti-slop guidance. Live Refero search was unavailable because the connected subscription was inactive.

## Verification

The export script verifies PNG pixel dimensions, local image loading, font readiness, and text bounds. The final contact sheet, pinned cover, profile/header, feed, story, and carousel layouts were visually reviewed for typography, cropping, spacing, and correct handles.
