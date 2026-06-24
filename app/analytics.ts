type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
type AnalyticsDebugDetail = {
  endpoint: string;
  event: string;
  status: number | "queued" | "disabled" | "error";
  message?: string;
  sentAt: string;
};

type GtagCommand = "js" | "config" | "event";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: GtagCommand, target: string | Date, params?: Record<string, unknown>) => void;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const OPT_OUT_KEY = "timewall.analytics.optOut";

let initialized = false;

const isAnalyticsDisabled = () => {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return true;
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

const initGoogleAnalytics = () => {
  if (initialized) return true;
  if (isAnalyticsDisabled()) return false;
  const measurementId = GA_MEASUREMENT_ID;
  if (!measurementId) return false;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args) {
      window.dataLayer?.push(args);
    };

  const existingScript = document.querySelector(`script[src*="${measurementId}"]`);
  if (!existingScript) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    page_path: window.location.pathname,
    page_title: document.title,
    send_page_view: true,
  });

  initialized = true;
  return true;
};

const baseProperties = () => ({
  app: "timewall",
  app_version: "timewall5",
  page_path: window.location.pathname,
  viewport_width: window.innerWidth,
  viewport_height: window.innerHeight,
  language: navigator.language,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

export const trackAnalytics = (event: string, properties: AnalyticsProperties = {}) => {
  if (!initGoogleAnalytics()) {
    emitDebug({
      endpoint: "google_analytics",
      event,
      status: "disabled",
      sentAt: new Date().toLocaleTimeString(),
    });
    return;
  }

  window.gtag?.("event", event, {
    ...baseProperties(),
    ...properties,
  });

  emitDebug({
    endpoint: "google_analytics",
    event,
    status: "queued",
    sentAt: new Date().toLocaleTimeString(),
  });
};

