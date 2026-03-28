type PrefetchTaskKey =
  | "layout-funnel"
  | "saju-input"
  | "fortune-hub"
  | "fortune-personal"
  | "fortune-yearly"
  | "chat"
  | "mypage"
  | "result"
  | "astrology"
  | "astrology-daily"
  | "astrology-calendar"
  | "love-future"
  | "love-couple"
  | "love-crush"
  | "suggestions"
  | "help";

const taskMap: Record<PrefetchTaskKey, () => Promise<unknown>> = {
  "layout-funnel": () =>
    import("@/components/layout/FunnelLayout").then(() => undefined),
  "saju-input": () => import("@/pages/SajuInput").then(() => undefined),
  "fortune-hub": () => import("@/pages/fortune/FortuneHubPage").then(() => undefined),
  "fortune-personal": () =>
    import("@/pages/fortune/FortunePersonalPage").then(() => undefined),
  "fortune-yearly": () => import("@/pages/fortune/YearlyFortunePage").then(() => undefined),
  chat: () => import("@/pages/ChatPage").then(() => undefined),
  mypage: () => import("@/pages/MyPage").then(() => undefined),
  result: () => import("@/pages/ResultPage").then(() => undefined),
  astrology: () => import("@/pages/AstrologyPage").then(() => undefined),
  "astrology-daily": () => import("@/pages/DailyAstrologyPage").then(() => undefined),
  "astrology-calendar": () =>
    import("@/pages/CosmicCalendarPage").then(() => undefined),
  "love-future": () =>
    import("@/pages/love/FuturePartnerPage").then(() => undefined),
  "love-couple": () =>
    import("@/pages/love/CoupleReportPage").then(() => undefined),
  "love-crush": () =>
    import("@/pages/love/CrushReunionPage").then(() => undefined),
  suggestions: () => import("@/pages/SuggestionPage").then(() => undefined),
  help: () => import("@/pages/HelpPage").then(() => undefined),
};

const warmedTasks = new Set<PrefetchTaskKey>();

const normalizePath = (path: string) => {
  const withoutHash = path.split("#")[0];
  return withoutHash.split("?")[0];
};

const runTask = (key: PrefetchTaskKey) => {
  if (warmedTasks.has(key)) {
    return;
  }

  warmedTasks.add(key);
  void taskMap[key]().catch(() => {
    warmedTasks.delete(key);
  });
};

const runTasks = (keys: PrefetchTaskKey[]) => {
  keys.forEach(runTask);
};

export const prefetchRoute = (rawPath: string) => {
  const path = normalizePath(rawPath);

  if (path.startsWith("/category/")) {
    return;
  }

  if (path === "/saju") {
    runTasks(["layout-funnel", "saju-input"]);
    return;
  }

  if (path === "/fortune") {
    runTasks(["fortune-hub"]);
    return;
  }

  if (path === "/fortune/personal") {
    runTasks(["layout-funnel", "fortune-personal"]);
    return;
  }

  if (path === "/fortune/yearly") {
    runTasks(["layout-funnel", "fortune-yearly"]);
    return;
  }

  if (path === "/chat") {
    runTasks(["chat"]);
    return;
  }

  if (path === "/mypage") {
    runTasks(["mypage"]);
    return;
  }

  if (path === "/result" || path.startsWith("/result/")) {
    runTasks(["result"]);
    return;
  }

  if (path === "/astrology") {
    runTasks(["astrology"]);
    return;
  }

  if (path === "/astrology/daily") {
    runTasks(["astrology-daily"]);
    return;
  }

  if (path === "/astrology/calendar") {
    runTasks(["astrology-calendar"]);
    return;
  }

  if (path === "/love/future-partner") {
    runTasks(["love-future"]);
    return;
  }

  if (path === "/love/couple-report") {
    runTasks(["love-couple"]);
    return;
  }

  if (path === "/love/crush-reunion") {
    runTasks(["love-crush"]);
    return;
  }

  if (path === "/suggestions") {
    runTasks(["suggestions"]);
    return;
  }

  if (path === "/help") {
    runTasks(["help"]);
  }
};

export const warmCoreRoutes = () => {
  runTasks([
    "layout-funnel",
    "saju-input",
    "fortune-hub",
    "love-couple",
    "mypage",
  ]);
};
