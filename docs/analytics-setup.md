# Timewall 5 MVP Analytics

Timewall 5 writes anonymous MVP usage data to Google Sheets through a Google Apps Script Web App.

The analytics goal is to verify whether users can keep using Timewall as a daily time-recording habit.

## Privacy Boundary

Collected:

- Anonymous browser `user_id`
- Per-tab `session_id`
- Device/browser metadata
- View switching behavior
- Time block edits by date and block range
- Weekly report opens, style changes, copies, and exports
- Four color labels from the weekly report naming fields

Not collected:

- Name
- Email
- IP address
- Login identity
- Backup JSON files
- Any text input other than the four color labels

## Google Sheets Tables

The Apps Script in `docs/google-sheets-apps-script.js` creates and maintains these sheets.

### `users`

One row per anonymous browser user.

Useful for:

- User count
- First seen / last seen
- Device and browser split
- Language and timezone split

### `sessions`

One row per browser session.

Useful for:

- Session duration
- Event count per session
- Entry view and last view

### `events`

One row per interaction event.

Main events:

- `app_open`
- `block_update`
- `date_select`
- `view_switch`
- `go_today`
- `theme_change`
- `label_change`
- `day_lock_toggle`
- `report_open`
- `report_style_change`
- `report_copy`
- `report_export`

Useful for:

- Week / month / year view click rate
- Weekly report click rate
- Weekly report export rate
- Which date and time block users edit

### `daily_records`

One row per day snapshot after a user edits or locks a day.

Useful for:

- Filled block count per day
- Daily recording completeness
- Dominant color
- Continuous recording analysis

### `label_snapshots`

One row when labels are captured.

Triggers:

- App open
- Weekly report open
- Theme change
- Label input commit

Useful for:

- Color naming rate
- Common label words
- Whether users who name colors have higher retention

## Required GitHub Variable

- `NEXT_PUBLIC_SHEETS_ANALYTICS_URL`

The value should be the Apps Script Web App URL ending in `/exec`.

## Deploy The Apps Script

1. Open the Google Sheet used as the analytics backend.
2. Open `Extensions` -> `Apps Script`.
3. Replace all code in `Code.gs` with `docs/google-sheets-apps-script.js`.
4. Click `Save`.
5. Click `Deploy` -> `Manage deployments`.
6. Edit the existing Web App deployment.
7. Set `Version` to `New version`.
8. Keep access as `Anyone`.
9. Click `Deploy`.

## Debug Link

After deployment, open:

```text
https://jinjin12123jin-sketch.github.io/timewall_5/?debug=analytics
```

When you click a time block, the debug panel should show:

```text
block_update · sent
daily_record_snapshot · sent
```

Then open the Google Sheet. Rows should appear in `events`, `users`, `sessions`, and `daily_records`.
