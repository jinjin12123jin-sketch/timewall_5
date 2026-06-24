# Timewall 5 Anonymous Analytics

Timewall 5 now uses Google Analytics 4 (GA4) through the official Google tag (`gtag.js`).

The app only sends anonymous product events. It does not send color labels, daily notes, backup files, or the user's Timewall content.

## Events

- `timewall_app_open`: app loaded
- `timewall_view_switch`: user switches Day / Week / Month / Year
- `timewall_block_edit`: user changes one time block color
- `timewall_date_select`: user selects a date from week / month / year views
- `timewall_go_today`: user returns to today
- `timewall_theme_change`: user changes the color system
- `timewall_report_open`: user opens weekly report
- `timewall_report_style_change`: user changes report style
- `timewall_report_copy`: user copies report text
- `timewall_report_export`: user exports report image

## Required GitHub Variable

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

The value should look like:

```text
G-XXXXXXXXXX
```

## How To Get The GA4 Measurement ID

In Google Analytics:

1. Open `Admin`.
2. Open `Data streams`.
3. Choose or create a `Web` stream.
4. Use the Timewall URL:

```text
https://jinjin12123jin-sketch.github.io/timewall_5/
```

5. Copy the `Measurement ID`.

## GitHub Pages Setup

1. Open the `timewall_5` GitHub repository.
2. Open `Settings`.
3. Open `Secrets and variables` -> `Actions` -> `Variables`.
4. Add `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
5. Re-run the GitHub Pages workflow, or push a new commit.

## Debug Link

After deployment, open:

```text
https://jinjin12123jin-sketch.github.io/timewall_5/?debug=analytics
```

When you click a time block, the small debug panel should show:

```text
timewall_block_edit · queued
```

In GA4, use `Reports` -> `Realtime` or `Admin` -> `DebugView` to verify events.

## Privacy Guardrails

- Browser Do Not Track disables analytics.
- Users' local records remain in the browser.
- Do not add label text, note text, backup JSON, or raw daily block arrays to analytics events.

