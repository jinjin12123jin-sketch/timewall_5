# Timewall 5 Anonymous Analytics

Timewall 5 keeps user records local by default. The analytics layer only sends anonymous product events and does not send color labels, daily notes, backup files, or the user's Timewall content.

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

## Provider

The current implementation sends events directly to PostHog's capture endpoint when the public project key is configured. If no key is configured, analytics is a no-op.

Required GitHub repository variable:

- `NEXT_PUBLIC_POSTHOG_KEY`

Optional GitHub repository variable:

- `NEXT_PUBLIC_POSTHOG_HOST`

Use the host shown in your PostHog project settings. If this variable is empty, Timewall uses `https://us.i.posthog.com`.

## GitHub Pages Setup

1. Open `Settings` in the `timewall_5` GitHub repository.
2. Open `Secrets and variables` -> `Actions` -> `Variables`.
3. Add `NEXT_PUBLIC_POSTHOG_KEY`.
4. Optionally add `NEXT_PUBLIC_POSTHOG_HOST`.
5. Re-run the GitHub Pages workflow, or push a new commit.

After deployment, events should appear in PostHog after users visit the public GitHub Pages link.

## Privacy Guardrails

- A random anonymous browser id is stored in localStorage.
- Browser Do Not Track disables analytics.
- Users' local records remain in the browser.
- Do not add label text, note text, backup JSON, or raw daily block arrays to analytics events.

