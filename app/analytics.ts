type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
type AnalyticsDebugDetail = {
  endpoint: string;
  event: string;
  status: number | "error" | "disabled";
  message?: string;
  sentAt: string;
};

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/$/, "");
const DISTINCT_ID_KEY = "timewall.analytics.distinctId";
const OPT_OUT_KEY = "timewall.analytics.optOut";

const getDistinctId = () => {
  if (typeof window === "undefined") return "";
  const stored = window.localStorage.getItem(DISTINCT_ID_KEY);
  if (stored) return stored;
  const generated = window.crypto?.randomUUID?.() ?? `tw_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(DISTINCT_ID_KEY, generated);
  return generated;
};

const isAnalyticsDisabled = () => {
  if (!POSTHOG_KEY || typeof window === "undefined") return true;
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

const baseProperties = () => {
  const referrerHost = (() => {
    try {
      return document.referrer ? new URL(document.referrer).host : "";
    } catch {
      return "";
    }
  })();

  return {
    app: "timewall",
    app_version: "timewall5",
    path: window.location.pathname,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    referrer_host: referrerHost,
  };
};

export const trackAnalytics = (event: string, properties: AnalyticsProperties = {}) => {
  if (isAnalyticsDisabled()) {
    emitDebug({
      endpoint: "disabled",
      event,
      status: "disabled",
      sentAt: new Date().toLocaleTimeString(),
    });
    return;
  }

  const payload = {
    api_key: POSTHOG_KEY,
    event,
    distinct_id: getDistinctId(),
    properties: {
      ...baseProperties(),
      ...properties,
    },
  };

  const sendEvent = async (endpoint: string) => {
    try {
      const response = await window.fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      emitDebug({
        endpoint,
        event,
        status: response.status,
        sentAt: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      emitDebug({
        endpoint,
        event,
        status: "error",
        message: error instanceof Error ? error.message : "unknown error",
        sentAt: new Date().toLocaleTimeString(),
      });
    }
  };

  void sendEvent(`${POSTHOG_HOST}/i/v0/e/`);

  if (isDebugEnabled()) {
    void sendEvent(`${POSTHOG_HOST}/capture/`);
  }
};
