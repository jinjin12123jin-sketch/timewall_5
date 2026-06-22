import posthog from "posthog-js";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const OPT_OUT_KEY = "timewall.analytics.optOut";

let initialized = false;

const isAnalyticsDisabled = () => {
  if (!POSTHOG_KEY || typeof window === "undefined") return true;
  if (window.localStorage.getItem(OPT_OUT_KEY) === "true") return true;
  return navigator.doNotTrack === "1";
};

const initPostHog = () => {
  if (initialized) return true;
  if (isAnalyticsDisabled()) return false;
  const token = POSTHOG_KEY;
  if (!token) return false;

  posthog.init(token, {
    api_host: POSTHOG_HOST,
    defaults: "2026-05-30",
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
    request_batching: false,
  });

  initialized = true;
  return true;
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
  if (!initPostHog()) return;

  posthog.capture(event, {
    ...baseProperties(),
    ...properties,
  });
};
