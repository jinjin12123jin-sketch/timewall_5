type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

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
  if (isAnalyticsDisabled()) return;

  const payload = {
    api_key: POSTHOG_KEY,
    event,
    distinct_id: getDistinctId(),
    properties: {
      ...baseProperties(),
      ...properties,
    },
  };

  window
    .fetch(`${POSTHOG_HOST}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    })
    .catch(() => {
      // Analytics must never block the product experience.
    });
};
