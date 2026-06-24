type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
type AnalyticsDebugDetail = {
  endpoint: string;
  event: string;
  status: "sent" | "disabled" | "error";
  message?: string;
  sentAt: string;
};

const SHEETS_ANALYTICS_URL = process.env.NEXT_PUBLIC_SHEETS_ANALYTICS_URL;
const OPT_OUT_KEY = "timewall.analytics.optOut";

const isAnalyticsDisabled = () => {
  if (!SHEETS_ANALYTICS_URL || typeof window === "undefined") return true;
  if (window.localStorage.getItem(OPT_OUT_KEY) === "true") return true;
  return navigator.doNotTrack === "1";
};

const isDebugEnabled = () => {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debug") === "analytics";
};

const emitDebug = (detail: AnalyticsDebugDetail) => {
  if (!isDebugEnabled()) return;
  window.dispatchEvent(new CustomEvent("timewall-analytics-debug", { detail }));
};

const baseProperties = () => ({
  app: "timewall",
  app_version: "timewall5",
  page_path: window.location.pathname,
  viewport_width: window.innerWidth,
  viewport_height: window.innerHeight,
  language: navigator.language,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  user_agent: navigator.userAgent,
});

export const trackAnalytics = (event: string, properties: AnalyticsProperties = {}) => {
  if (isAnalyticsDisabled()) {
    emitDebug({
      endpoint: "google_sheets",
      event,
      status: "disabled",
      sentAt: new Date().toLocaleTimeString(),
    });
    return;
  }

  const endpoint = SHEETS_ANALYTICS_URL;
  if (!endpoint) return;

  const payload = {
    event,
    sent_at: new Date().toISOString(),
    properties: {
      ...baseProperties(),
      ...properties,
    },
  };

  try {
    void window.fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    emitDebug({
      endpoint: "google_sheets",
      event,
      status: "sent",
      sentAt: new Date().toLocaleTimeString(),
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
