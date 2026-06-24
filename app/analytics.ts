type AnalyticsPrimitive = string | number | boolean | null | undefined;
type AnalyticsValue = AnalyticsPrimitive | AnalyticsPrimitive[] | Record<string, AnalyticsPrimitive>;
type AnalyticsProperties = Record<string, AnalyticsValue>;
type AnalyticsDebugDetail = {
  endpoint: string;
  event: string;
  status: "sent" | "disabled" | "error";
  message?: string;
  sentAt: string;
};

type DailyRecordPayload = {
  recordDate: string;
  blocksState: number[];
  themeId: string;
  isLocked: boolean;
};

type LabelSnapshotPayload = {
  trigger: string;
  themeId: string;
  labels: string[];
};

const SHEETS_ANALYTICS_URL = process.env.NEXT_PUBLIC_SHEETS_ANALYTICS_URL;
const OPT_OUT_KEY = "timewall.analytics.optOut";
const USER_ID_KEY = "timewall.analytics.userId";
const SESSION_ID_KEY = "timewall.analytics.sessionId";
const SESSION_STARTED_KEY = "timewall.analytics.sessionStartedAt";

const createId = (prefix: string) => {
  const random = crypto.getRandomValues(new Uint32Array(4));
  const body = Array.from(random, (value) => value.toString(36)).join("");
  return `${prefix}_${Date.now().toString(36)}_${body}`;
};

const getUserId = () => {
  let userId = window.localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = createId("tw_u");
    window.localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

const getSession = () => {
  let sessionId = window.sessionStorage.getItem(SESSION_ID_KEY);
  let startedAt = window.sessionStorage.getItem(SESSION_STARTED_KEY);
  if (!sessionId || !startedAt) {
    sessionId = createId("tw_s");
    startedAt = new Date().toISOString();
    window.sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    window.sessionStorage.setItem(SESSION_STARTED_KEY, startedAt);
  }
  return { sessionId, startedAt };
};

const getDisabledReason = () => {
  if (typeof window === "undefined") return "not_in_browser";
  if (!SHEETS_ANALYTICS_URL) return "missing_sheets_endpoint";
  if (window.localStorage.getItem(OPT_OUT_KEY) === "true") return "opted_out";
  return "";
};

const isDebugEnabled = () => {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debug") === "analytics";
};

const emitDebug = (detail: AnalyticsDebugDetail) => {
  if (!isDebugEnabled()) return;
  window.dispatchEvent(new CustomEvent("timewall-analytics-debug", { detail }));
};

const getDeviceType = () => {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1100) return "tablet";
  return "desktop";
};

const detectBrowser = () => {
  const ua = navigator.userAgent;
  if (/MicroMessenger/i.test(ua)) return "wechat";
  if (/Edg/i.test(ua)) return "edge";
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return "chrome";
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "safari";
  if (/Firefox/i.test(ua)) return "firefox";
  return "unknown";
};

const baseProperties = () => {
  const { sessionId, startedAt } = getSession();
  return {
    user_id: getUserId(),
    session_id: sessionId,
    session_started_at: startedAt,
    app: "timewall",
    app_version: "timewall5",
    page_path: window.location.pathname,
    device_type: getDeviceType(),
    browser: detectBrowser(),
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    referrer: document.referrer,
    user_agent: navigator.userAgent,
  };
};

const sendAnalytics = (recordType: string, event: string, properties: AnalyticsProperties = {}) => {
  const disabledReason = getDisabledReason();
  if (disabledReason) {
    emitDebug({
      endpoint: "google_sheets",
      event,
      status: "disabled",
      message: disabledReason,
      sentAt: new Date().toLocaleTimeString(),
    });
    return;
  }

  const endpoint = SHEETS_ANALYTICS_URL;
  if (!endpoint) return;

  const payload = {
    record_type: recordType,
    event,
    sent_at: new Date().toISOString(),
    properties: {
      ...baseProperties(),
      ...properties,
    },
  };

  try {
    void window
      .fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      })
      .then(() => {
        emitDebug({
          endpoint: "google_sheets",
          event,
          status: "sent",
          sentAt: new Date().toLocaleTimeString(),
        });
      })
      .catch((error: unknown) => {
        emitDebug({
          endpoint: "google_sheets",
          event,
          status: "error",
          message: error instanceof Error ? error.message : String(error),
          sentAt: new Date().toLocaleTimeString(),
        });
      });
  } catch (error) {
    emitDebug({
      endpoint: "google_sheets",
      event,
      status: "error",
      message: error instanceof Error ? error.message : String(error),
      sentAt: new Date().toLocaleTimeString(),
    });
  }
};

export const trackAnalytics = (event: string, properties: AnalyticsProperties = {}) => {
  sendAnalytics("event", event, properties);
};

export const trackSessionStart = (properties: AnalyticsProperties = {}) => {
  const { startedAt } = getSession();
  sendAnalytics("session", "session_start", {
    session_started_at: startedAt,
    ...properties,
  });
};

export const trackDailyRecord = ({ recordDate, blocksState, themeId, isLocked }: DailyRecordPayload) => {
  const counts = [0, 0, 0, 0].map((_, colorIndex) => blocksState.filter((block) => block === colorIndex).length);
  const dominantColorIndex = counts.indexOf(Math.max(...counts));
  sendAnalytics("daily_record", "daily_record_snapshot", {
    record_date: recordDate,
    blocks_state: blocksState.join(","),
    blocks_filled_count: blocksState.filter((block) => block !== 0).length,
    dominant_color_index: dominantColorIndex,
    theme_id: themeId,
    is_locked: isLocked,
  });
};

export const trackLabelSnapshot = ({ trigger, themeId, labels }: LabelSnapshotPayload) => {
  sendAnalytics("label_snapshot", "label_snapshot", {
    trigger,
    theme_id: themeId,
    color_label_0: labels[0] ?? "",
    color_label_1: labels[1] ?? "",
    color_label_2: labels[2] ?? "",
    color_label_3: labels[3] ?? "",
    color_label_0_length: labels[0]?.trim().length ?? 0,
    color_label_1_length: labels[1]?.trim().length ?? 0,
    color_label_2_length: labels[2]?.trim().length ?? 0,
    color_label_3_length: labels[3]?.trim().length ?? 0,
  });
};
