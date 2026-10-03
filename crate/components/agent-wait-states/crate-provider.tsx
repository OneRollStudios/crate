"use client";

import { createContext, useContext, useMemo } from "react";

/** Locale-aware helpers passed to every label that contains a number. */
export type CrateFormat = {
  locale: string;
  /** 1234 -> "1,234" (en) or "1 234" (fr). */
  number: (value: number) => string;
  /** 30 -> "30s" in en. Other locales use their own short unit format. */
  seconds: (value: number) => string;
  /** Picks a form by Intl plural rules, e.g. plural(n, { one: "source", other: "sources" }). */
  plural: (value: number, forms: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }) => string;
};

export type CrateLabels = {
  thinking: string;
  stillThinking: string;
  cancel: string;
  responseStreaming: string;
  toolActivity: string;
  runningTool: (toolName: string) => string;
  stalled: string;
  error: string;
  retry: string;
  done: string;
  showThinking: string;
  thoughtFor: (seconds: number, format: CrateFormat) => string;
  reasoningPlaceholder: string;
  sources: string;
  sourceFallback: string;
  sourceTitle: string;
  moreSources: (count: number, format: CrateFormat) => string;
  plan: string;
  planProgress: (current: number, total: number, format: CrateFormat) => string;
  approvalRequired: string;
  approvalTitle: string;
  approvalPreview: string;
  expiresIn: (seconds: number, format: CrateFormat) => string;
  deny: string;
  allow: string;
  queuePosition: (position: number, format: CrateFormat) => string;
  rateLimited: (seconds: number, format: CrateFormat) => string;
  fileUploading: string;
  fileReading: string;
  fileChunking: string;
  fileReady: string;
  fileProgress: (percent: number, format: CrateFormat) => string;
};

export const defaultLabels: CrateLabels = {
  thinking: "Thinking…",
  stillThinking: "Still thinking…",
  cancel: "Cancel",
  responseStreaming: "Response streaming",
  toolActivity: "Agent tool activity",
  runningTool: (toolName) => `Running ${toolName}…`,
  stalled: "Still working…",
  error: "Something went wrong.",
  retry: "Retry",
  done: "Done",
  showThinking: "Show thinking",
  thoughtFor: (seconds, f) => `Thought for ${f.seconds(seconds)}`,
  reasoningPlaceholder: "Working through the details…",
  sources: "Sources",
  sourceFallback: "source",
  sourceTitle: "Source",
  moreSources: (count, f) => `+${f.number(count)} more`,
  plan: "Plan",
  planProgress: (current, total, f) => `${f.number(current)} of ${f.number(total)}`,
  approvalRequired: "Approval required",
  approvalTitle: "The agent wants to send this email",
  approvalPreview: "Review this action before it runs.",
  expiresIn: (seconds, f) => `Expires in ${f.seconds(seconds)}`,
  deny: "Deny",
  allow: "Allow",
  queuePosition: (position, f) => `You’re #${f.number(position)} in line`,
  rateLimited: (seconds, f) => `Slow down. Try again in ${f.seconds(seconds)}`,
  fileUploading: "Upload",
  fileReading: "Reading",
  fileChunking: "Chunking",
  fileReady: "Ready",
  fileProgress: (percent, f) => `${f.number(percent)}%`,
};

export function createFormat(locale: string): CrateFormat {
  const number = new Intl.NumberFormat(locale);
  const seconds = new Intl.NumberFormat(locale, { style: "unit", unit: "second", unitDisplay: "narrow" });
  const plural = new Intl.PluralRules(locale);
  return {
    locale,
    number: (value) => number.format(value),
    seconds: (value) => seconds.format(value),
    plural: (value, forms) => forms[plural.select(value)] ?? forms.other,
  };
}

type CrateContextValue = { labels: CrateLabels; format: CrateFormat };

const CrateContext = createContext<CrateContextValue>({ labels: defaultLabels, format: createFormat("en") });

export type CrateProviderProps = {
  /** Any labels to replace. Missing ones fall back to English. */
  labels?: Partial<CrateLabels>;
  /** BCP 47 locale for numbers, times, and plurals, e.g. "fr" or "ar-EG". Inherited when omitted. */
  locale?: string;
  children: React.ReactNode;
};

/** Sets labels and locale for every crate component inside it. Renders no element. */
export function CrateProvider({ labels, locale, children }: CrateProviderProps) {
  const parent = useContext(CrateContext);
  const resolvedLocale = locale ?? parent.format.locale;
  const value = useMemo(
    () => ({
      labels: { ...parent.labels, ...labels },
      format: resolvedLocale === parent.format.locale ? parent.format : createFormat(resolvedLocale),
    }),
    [parent, labels, resolvedLocale],
  );
  return <CrateContext.Provider value={value}>{children}</CrateContext.Provider>;
}

/** Labels and format for a component: provider values, overridden by the component's own labels prop. */
export function useCrate(overrides?: Partial<CrateLabels>): CrateContextValue {
  const context = useContext(CrateContext);
  return useMemo(
    () => (overrides ? { labels: { ...context.labels, ...overrides }, format: context.format } : context),
    [context, overrides],
  );
}
