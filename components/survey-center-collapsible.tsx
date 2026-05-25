"use client";

import { useMemo, useState } from "react";
import {
  defaultSurveyConfig,
  parseSurveyConfig,
  suggestedTemplateIdsForProfession,
  validateSurveyConfigPayload,
} from "@/lib/surveys/config";
import { questionBankByCategory } from "@/lib/surveys/question-bank";
import { SURVEY_TEMPLATES } from "@/lib/surveys/templates";
import {
  MAX_CUSTOM_QUESTIONS,
  type ProviderSurveyConfig,
} from "@/lib/surveys/types";

type Props = {
  initialConfig: unknown;
  profession: string | null;
  /** `settings-page` = dashboard Settings card; default matches other collapsibles there. */
  variant?: "settings-page";
};

export function SurveyCenterCollapsible({
  initialConfig,
  profession,
  variant = "settings-page",
}: Props) {
  const parsedInitial = useMemo(
    () => parseSurveyConfig(initialConfig),
    [initialConfig],
  );

  const [config, setConfig] = useState<ProviderSurveyConfig>(parsedInitial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const categories = useMemo(() => questionBankByCategory(), []);
  const suggestions = useMemo(
    () => suggestedTemplateIdsForProfession(profession),
    [profession],
  );

  function toggleTemplate(templateId: string) {
    setConfig((prev) => {
      const enabled = prev.enabledTemplateIds.includes(templateId);
      const nextIds = enabled
        ? prev.enabledTemplateIds.filter((id) => id !== templateId)
        : [...prev.enabledTemplateIds, templateId];
      return { ...prev, enabledTemplateIds: nextIds };
    });
  }

  function toggleCustomQuestion(questionId: string) {
    setConfig((prev) => {
      const has = prev.custom.questionIds.includes(questionId);
      if (!has && prev.custom.questionIds.length >= MAX_CUSTOM_QUESTIONS) {
        return prev;
      }
      const nextIds = has
        ? prev.custom.questionIds.filter((id) => id !== questionId)
        : [...prev.custom.questionIds, questionId];
      return {
        ...prev,
        custom: { ...prev.custom, enabled: true, questionIds: nextIds },
      };
    });
  }

  async function saveConfig() {
    setMessage(null);
    const validation = validateSurveyConfigPayload(config);
    if (!validation.ok) {
      setMessage(validation.error);
      return;
    }

    setLoading(true);
    const response = await fetch("/api/profile/survey-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const payload = (await response.json()) as { error?: string; ok?: boolean };
    setLoading(false);

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to save survey settings.");
      return;
    }

    setMessage("Survey settings saved.");
  }

  function applySuggestions() {
    setConfig((prev) => ({
      ...prev,
      enabledTemplateIds: [...new Set([...prev.enabledTemplateIds, ...suggestions])],
    }));
  }

  function resetDefaults() {
    setConfig(defaultSurveyConfig());
  }

  const enabledCount =
    config.enabledTemplateIds.length + (config.custom.enabled ? 1 : 0);

  return (
    <details className={variant === "settings-page" ? undefined : "card p-5 sm:p-6"}>
      <summary className="cursor-pointer text-sm font-medium text-foreground">
        Survey center: customize user testimonials
      </summary>

      <div className="mt-4 space-y-6">
        <p className="text-sm text-muted">
          Choose which review surveys appear when someone adds a testimonial on
          your public profile. Every survey always includes overall stars,
          recommendation, and reviewer state so your profile summary stays
          complete.
        </p>

        {suggestions.length > 0 ? (
          <div className="rounded-md border border-border bg-surface-alt/50 px-3 py-2 text-sm text-muted">
            Based on your profession, we suggest:{" "}
            {suggestions
              .map((id) => SURVEY_TEMPLATES.find((t) => t.id === id)?.name ?? id)
              .join(", ")}
            .{" "}
            <button
              type="button"
              onClick={applySuggestions}
              className="font-medium text-accent-secondary underline-offset-2 hover:underline"
            >
              Add suggested surveys
            </button>
          </div>
        ) : null}

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Pre-made surveys</h3>
          <ul className="grid gap-3">
            {SURVEY_TEMPLATES.map((template) => {
              const checked = config.enabledTemplateIds.includes(template.id);
              return (
                <li key={template.id}>
                  <label className="flex cursor-pointer gap-3 rounded-lg border border-border p-4 transition hover:bg-surface-alt/40 has-[:checked]:border-accent-primary/60 has-[:checked]:bg-accent-primary/5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTemplate(template.id)}
                      className="mt-1 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        {template.name}
                      </span>
                      <span className="mt-1 block text-sm text-muted">
                        {template.description}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="space-y-3 rounded-lg border border-border/60 bg-surface-alt/30 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Build your own survey
              </h3>
              <p className="mt-1 text-sm text-muted">
                Pick up to {MAX_CUSTOM_QUESTIONS} optional questions from the bank.
                Required questions (stars, recommend, state) are always included.
              </p>
            </div>
            <label className="flex shrink-0 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.custom.enabled}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    custom: { ...prev.custom, enabled: e.target.checked },
                  }))
                }
              />
              Enable custom survey
            </label>
          </div>

          {config.custom.enabled ? (
            <div className="space-y-4">
              <p className="text-xs text-muted">
                Selected {config.custom.questionIds.length}/{MAX_CUSTOM_QUESTIONS}
              </p>
              {[...categories.entries()].map(([category, questions]) => (
                <div key={category}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {category}
                  </p>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {questions.map((q) => {
                      const checked = config.custom.questionIds.includes(q.id);
                      const atMax =
                        !checked &&
                        config.custom.questionIds.length >= MAX_CUSTOM_QUESTIONS;
                      return (
                        <li key={q.id}>
                          <label
                            className={`flex gap-2 rounded-md border border-border/70 px-3 py-2 text-sm ${
                              atMax ? "opacity-50" : "cursor-pointer hover:bg-surface-alt/50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={atMax}
                              onChange={() => toggleCustomQuestion(q.id)}
                              className="mt-0.5 shrink-0"
                            />
                            <span className="text-muted">{q.label}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <div className="rounded-md border border-border bg-surface-alt/40 p-3 text-sm text-muted">
          <p className="font-medium text-foreground">Preview</p>
          <p className="mt-1">
            Reviewers will see{" "}
            {enabledCount === 1
              ? "one survey option"
              : `${enabledCount} survey options`}{" "}
            when adding a testimonial.
            {config.custom.enabled && config.custom.questionIds.length > 0
              ? ` Your custom survey includes ${config.custom.questionIds.length} optional question${
                  config.custom.questionIds.length === 1 ? "" : "s"
                }.`
              : null}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => void saveConfig()}
            className="rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save survey settings"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={resetDefaults}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted transition hover:bg-surface-alt hover:text-foreground disabled:opacity-60"
          >
            Reset to defaults
          </button>
        </div>

        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </div>
    </details>
  );
}
