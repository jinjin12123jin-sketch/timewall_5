/* eslint-disable */

const SHEETS = {
  users: [
    "user_id",
    "first_seen_at",
    "last_seen_at",
    "device_type",
    "browser",
    "language",
    "timezone",
    "screen_width",
    "screen_height",
    "app_version",
    "referrer",
    "user_agent",
  ],
  sessions: [
    "session_id",
    "user_id",
    "started_at",
    "last_seen_at",
    "duration_seconds",
    "entry_view",
    "last_view",
    "event_count",
    "device_type",
    "browser",
    "app_version",
  ],
  events: [
    "received_at",
    "user_id",
    "session_id",
    "event",
    "view",
    "selected_date",
    "selected_week_start",
    "selected_week_end",
    "block_index",
    "block_time_range",
    "from_color_index",
    "next_color_index",
    "theme_id",
    "report_style",
    "filled_blocks",
    "page_path",
    "device_type",
    "browser",
    "language",
    "timezone",
    "raw_json",
  ],
  daily_records: [
    "saved_at",
    "user_id",
    "session_id",
    "record_date",
    "blocks_state",
    "blocks_filled_count",
    "dominant_color_index",
    "theme_id",
    "is_locked",
  ],
  label_snapshots: [
    "received_at",
    "user_id",
    "session_id",
    "theme_id",
    "trigger",
    "color_label_0",
    "color_label_1",
    "color_label_2",
    "color_label_3",
    "color_label_0_length",
    "color_label_1_length",
    "color_label_2_length",
    "color_label_3_length",
  ],
};

function getSheet_(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const headers = SHEETS[name];
  let sheet = spreadsheet.getSheetByName(name);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  return sheet;
}

function findRowByKey_(sheet, keyColumn, keyValue) {
  if (!keyValue || sheet.getLastRow() < 2) return 0;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const keyIndex = headers.indexOf(keyColumn);
  if (keyIndex < 0) return 0;
  const values = sheet.getRange(2, keyIndex + 1, sheet.getLastRow() - 1, 1).getValues();
  for (let index = 0; index < values.length; index += 1) {
    if (String(values[index][0]) === String(keyValue)) return index + 2;
  }
  return 0;
}

function appendByHeaders_(sheetName, valuesByHeader) {
  const sheet = getSheet_(sheetName);
  const headers = SHEETS[sheetName];
  sheet.appendRow(headers.map((header) => valuesByHeader[header] ?? ""));
}

function updateByHeaders_(sheetName, row, valuesByHeader) {
  const sheet = getSheet_(sheetName);
  const headers = SHEETS[sheetName];
  const current = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
  const next = headers.map((header, index) => (Object.prototype.hasOwnProperty.call(valuesByHeader, header) ? valuesByHeader[header] : current[index]));
  sheet.getRange(row, 1, 1, headers.length).setValues([next]);
}

function upsertUser_(props, receivedAt) {
  const userId = props.user_id;
  if (!userId) return;
  const sheet = getSheet_("users");
  const row = findRowByKey_(sheet, "user_id", userId);
  const values = {
    user_id: userId,
    first_seen_at: receivedAt,
    last_seen_at: receivedAt,
    device_type: props.device_type,
    browser: props.browser,
    language: props.language,
    timezone: props.timezone,
    screen_width: props.screen_width,
    screen_height: props.screen_height,
    app_version: props.app_version,
    referrer: props.referrer,
    user_agent: props.user_agent,
  };
  if (row) {
    delete values.first_seen_at;
    updateByHeaders_("users", row, values);
  } else {
    appendByHeaders_("users", values);
  }
}

function upsertSession_(props, receivedAt) {
  const sessionId = props.session_id;
  if (!sessionId) return;
  const sheet = getSheet_("sessions");
  const row = findRowByKey_(sheet, "session_id", sessionId);
  const startedAt = props.session_started_at ? new Date(props.session_started_at) : receivedAt;
  const durationSeconds = Math.max(0, Math.round((receivedAt.getTime() - startedAt.getTime()) / 1000));
  if (row) {
    const headers = SHEETS.sessions;
    const current = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
    const eventCountIndex = headers.indexOf("event_count");
    const currentEventCount = Number(current[eventCountIndex] || 0);
    updateByHeaders_("sessions", row, {
      last_seen_at: receivedAt,
      duration_seconds: durationSeconds,
      last_view: props.view || props.next_view || current[headers.indexOf("last_view")],
      event_count: currentEventCount + 1,
    });
  } else {
    appendByHeaders_("sessions", {
      session_id: sessionId,
      user_id: props.user_id,
      started_at: startedAt,
      last_seen_at: receivedAt,
      duration_seconds: durationSeconds,
      entry_view: props.entry_view || props.initial_view || props.view || "",
      last_view: props.view || props.next_view || "",
      event_count: 1,
      device_type: props.device_type,
      browser: props.browser,
      app_version: props.app_version,
    });
  }
}

function appendEvent_(body, props, receivedAt) {
  appendByHeaders_("events", {
    received_at: receivedAt,
    user_id: props.user_id,
    session_id: props.session_id,
    event: body.event,
    view: props.view,
    selected_date: props.selected_date,
    selected_week_start: props.selected_week_start,
    selected_week_end: props.selected_week_end,
    block_index: props.block_index,
    block_time_range: props.block_time_range,
    from_color_index: props.from_color_index,
    next_color_index: props.next_color_index,
    theme_id: props.theme_id,
    report_style: props.report_style,
    filled_blocks: props.filled_blocks,
    page_path: props.page_path,
    device_type: props.device_type,
    browser: props.browser,
    language: props.language,
    timezone: props.timezone,
    raw_json: JSON.stringify(body),
  });
}

function appendDailyRecord_(props, receivedAt) {
  appendByHeaders_("daily_records", {
    saved_at: receivedAt,
    user_id: props.user_id,
    session_id: props.session_id,
    record_date: props.record_date,
    blocks_state: props.blocks_state,
    blocks_filled_count: props.blocks_filled_count,
    dominant_color_index: props.dominant_color_index,
    theme_id: props.theme_id,
    is_locked: props.is_locked,
  });
}

function appendLabelSnapshot_(props, receivedAt) {
  appendByHeaders_("label_snapshots", {
    received_at: receivedAt,
    user_id: props.user_id,
    session_id: props.session_id,
    theme_id: props.theme_id,
    trigger: props.trigger,
    color_label_0: props.color_label_0,
    color_label_1: props.color_label_1,
    color_label_2: props.color_label_2,
    color_label_3: props.color_label_3,
    color_label_0_length: props.color_label_0_length,
    color_label_1_length: props.color_label_1_length,
    color_label_2_length: props.color_label_2_length,
    color_label_3_length: props.color_label_3_length,
  });
}

function doPost(e) {
  try {
    const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const props = body.properties || {};
    const receivedAt = body.sent_at ? new Date(body.sent_at) : new Date();

    upsertUser_(props, receivedAt);
    upsertSession_(props, receivedAt);

    if (body.record_type === "daily_record") {
      appendDailyRecord_(props, receivedAt);
    } else if (body.record_type === "label_snapshot") {
      appendLabelSnapshot_(props, receivedAt);
    } else if (body.record_type === "event") {
      appendEvent_(body, props, receivedAt);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "timewall-sheets-analytics-v2" }))
    .setMimeType(ContentService.MimeType.JSON);
}
