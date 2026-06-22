type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
type PostHogQueue = unknown[] & {
  __SV?: number;
  _i?: unknown[];
  init?: (token: string, config: Record<string, unknown>, name?: string) => void;
  capture?: (event: string, properties?: Record<string, unknown>) => void;
  people?: unknown[];
};

declare global {
  interface Window {
    posthog?: PostHogQueue;
  }
}

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const OPT_OUT_KEY = "timewall.analytics.optOut";

let initialized = false;

const isAnalyticsDisabled = () => {
  if (!POSTHOG_KEY || typeof window === "undefined") return true;
  if (window.localStorage.getItem(OPT_OUT_KEY) === "true") return true;
  return navigator.doNotTrack === "1";
};

const addQueuedMethod = (queue: PostHogQueue, method: string) => {
  queue[method as unknown as number] = (...args: unknown[]) => {
    queue.push([method, ...args]);
  };
};

const initPostHog = () => {
  if (initialized) return true;
  if (isAnalyticsDisabled()) return false;
  const token = POSTHOG_KEY;
  if (!token) return false;

  const existing = window.posthog;
  const posthogQueue = existing && existing.__SV ? existing : ([] as PostHogQueue);
  window.posthog = posthogQueue;
  posthogQueue._i = posthogQueue._i || [];
  posthogQueue.people = posthogQueue.people || [];

  const methods =
    "init capture register register_once unregister identify reset get_distinct_id opt_in_capturing opt_out_capturing has_opted_out_capturing debug".split(
      " ",
    );
  methods.forEach((method) => {
    if (!posthogQueue[method as unknown as number]) addQueuedMethod(posthogQueue, method);
  });

  posthogQueue.init = (projectToken: string, config: Record<string, unknown>, name = "posthog") => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.src = String(config.api_host).replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js";
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript.parentNode?.insertBefore(script, firstScript);
    posthogQueue._i?.push([projectToken, config, name]);
  };

  posthogQueue.init(token, {
    api_host: POSTHOG_HOST,
    defaults: "2026-05-30",
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
    request_batching: false,
  });

  posthogQueue.__SV = 1;
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

  window.posthog?.capture?.(event, {
    ...baseProperties(),
    ...properties,
  });
};

