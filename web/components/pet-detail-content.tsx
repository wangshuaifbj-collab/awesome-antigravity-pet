"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CopyCommandButton } from "@/components/copy-command-button";
import { ChatGPTIcon } from "@/components/chatgpt-icon";
import { PetInstallMenu } from "@/components/pet-install-menu";
import { PetLikeButton } from "@/components/pet-like-button";
import {
  PetPlayground,
  type PlaygroundAction,
} from "@/components/pet-playground";
import { ShareMenu } from "@/components/share-menu";
import { useLocale } from "@/components/locale-provider";
import {
  buildChatGPTUrl,
  getLocalizedPetName,
  getPetInstallPrompt,
} from "@/lib/codex-links";
import { getLocalizedCategoryLabel } from "@/lib/pet-localization";
import type { Pet } from "@/lib/pets";
import { siteConfig } from "@/lib/site";
import { fetchStats } from "@/lib/stats";
import { getLocalizedTagLabel } from "@/lib/tag-localization";

export type PetNavigation = {
  previous: { slug: string; name: string };
  next: { slug: string; name: string };
  slugs: string[];
};

type PetDetailContentProps = {
  pet: Pet;
  actions: PlaygroundAction[];
  navigation: PetNavigation;
};

type DetailStats = { installs: number };

function formatCount(value: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(
    value,
  );
}

export function PetDetailContent({
  pet,
  actions,
  navigation,
}: PetDetailContentProps) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [stats, setStats] = useState<DetailStats>({ installs: 0 });
  const localizedName = getLocalizedPetName(pet, locale);

  useEffect(() => {
    const controller = new AbortController();
    void fetchStats(controller.signal)
      .then((payload) => {
        const current = payload.pets[pet.slug];
        setStats({
          installs: current?.installs ?? 0,
        });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.warn(
            "Unable to load pet detail statistics",
            error instanceof Error ? error.stack : String(error),
          );
        }
      });
    return () => controller.abort();
  }, [pet.slug]);

  function shufflePet() {
    const candidates = navigation.slugs.filter((slug) => slug !== pet.slug);
    if (candidates.length === 0) return;
    const slug = candidates[Math.floor(Math.random() * candidates.length)];
    router.push(`/pets/${slug}`);
  }

  return (
    <main className="mx-auto max-w-[1480px] overflow-hidden px-6 pb-24">
      <nav
        className="flex items-center justify-between gap-4 py-6"
        aria-label={t("petNavigation")}
      >
        <Link
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
          href="/"
        >
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {t("backToGallery")}
        </Link>
        <div className="flex items-center gap-2">
          <Link
            className="inline-flex h-9 max-w-44 items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 text-sm text-muted transition-colors hover:border-border-hover hover:bg-surface hover:text-text"
            href={`/pets/${navigation.previous.slug}`}
            title={navigation.previous.name}
          >
            <span aria-hidden="true">←</span>
            <span className="hidden truncate sm:inline">
              {navigation.previous.name}
            </span>
          </Link>
          <button
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-bg-elevated text-muted transition-colors hover:border-border-hover hover:bg-surface hover:text-text"
            type="button"
            title={t("shufflePet")}
            aria-label={t("shufflePet")}
            onClick={shufflePet}
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"
              />
            </svg>
          </button>
          <Link
            className="inline-flex h-9 max-w-44 items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 text-sm text-muted transition-colors hover:border-border-hover hover:bg-surface hover:text-text"
            href={`/pets/${navigation.next.slug}`}
            title={navigation.next.name}
          >
            <span className="hidden truncate sm:inline">
              {navigation.next.name}
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </nav>

      <section>
        <PetPlayground
          pet={pet}
          actions={actions}
          sidebar={
            <div className="min-w-0 lg:sticky lg:top-24 lg:border-l lg:border-border lg:pl-10">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-accent-light px-2.5 py-1 text-xs font-medium text-accent">
                  {getLocalizedCategoryLabel(pet.categoryLabel, locale)}
                </span>
                <span className="text-xs text-muted">
                  v{pet.spriteVersionNumber}
                </span>
                <span className="text-xs text-muted">{pet.license}</span>
              </div>

              <h1 className="mb-4 text-5xl font-semibold leading-none tracking-tight text-text sm:text-6xl">
                {localizedName}
              </h1>
              <p className="mb-7 max-w-2xl text-base leading-relaxed text-muted">
                {pet.description ?? pet.runtimeDescription ?? t("defaultDesc")}
              </p>

              <div className="mb-7 flex flex-wrap gap-2">
                <PetInstallMenu pet={pet} variant="detail" />
                <PetLikeButton slug={pet.slug} variant="button" />
                <ShareMenu
                  title={localizedName}
                  url={`${siteConfig.url}/pets/${pet.slug}`}
                />
                <a
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 text-sm font-medium text-text transition-colors hover:bg-surface"
                  href={pet.repositoryPath}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    className="size-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  {t("source")}
                </a>
              </div>

              <div className="mb-8 border-y border-border py-4">
                <div>
                  <div className="font-mono text-xl font-semibold tabular-nums text-text">
                    {formatCount(stats.installs)}
                  </div>
                  <div className="text-xs text-muted">
                    {t("detailInstalls")}
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-5 gap-y-5 text-sm">
                <div>
                  <dt className="mb-1 text-xs text-muted">{t("author")}</dt>
                  <dd className="font-medium text-text">
                    <Link
                      className="text-accent hover:underline"
                      href={`/contributors/${pet.author_slug}`}
                    >
                      {pet.author_handle ?? pet.author}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-xs text-muted">
                    {t("displayName")}
                  </dt>
                  <dd className="font-medium text-text">
                    {pet.localizedNames?.zh && pet.localizedNames?.en
                      ? `${pet.localizedNames.zh} / ${pet.localizedNames.en}`
                      : localizedName}
                  </dd>
                </div>
                <div className="col-span-2 min-w-0">
                  <dt className="mb-1 text-xs text-muted">{t("slug")}</dt>
                  <dd>
                    <code
                      className="block truncate rounded-md bg-bg-secondary px-2 py-1 font-mono text-xs text-text-secondary"
                      title={pet.slugLabel}
                    >
                      {pet.slugLabel}
                    </code>
                  </dd>
                </div>
              </dl>

              {pet.tags.length > 0 ? (
                <div className="mt-7 flex flex-wrap gap-1.5">
                  {pet.tags.map((tag) => (
                    <span
                      className="rounded-md bg-bg-secondary px-2 py-1 text-xs text-text-secondary"
                      key={tag}
                      title={tag}
                    >
                      {getLocalizedTagLabel(tag, locale)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          }
        />
      </section>

      <section className="mt-20 border-y border-border py-10">
        <div className="mb-7 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            {t("installationGuide")}
          </p>
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-text">
            {t("installCommands")}
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            {t("detailInstallDesc")}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <a
            className="group flex min-h-32 flex-col justify-between rounded-lg border border-border bg-bg-elevated p-4 transition-colors hover:border-border-hover hover:bg-surface"
            href={buildChatGPTUrl(getPetInstallPrompt(pet, locale))}
            target="_blank"
            rel="noreferrer"
          >
            <ChatGPTIcon className="size-8" />
            <span className="mt-5">
              <span className="block text-sm font-semibold text-text">
                {t("openInCodex")}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">
                {t("codexRunsInstall")}
              </span>
            </span>
          </a>

          <InstallCopyMethod
            icon=">_"
            title={t("copyBashInstall")}
            description={t("bashInstallDesc")}
            command={pet.installCommand}
          />
          <InstallCopyMethod
            icon="PS"
            title={t("copyPowerShell")}
            description={t("powerShellInstallDesc")}
            command={pet.installCommandPowerShell}
          />

          <Link
            className="group flex min-h-32 flex-col justify-between rounded-lg border border-border bg-bg-elevated p-4 transition-colors hover:border-border-hover hover:bg-surface"
            href="/install"
          >
            <svg
              className="size-7 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c.301-.293.515-.63.643-1.003a4.5 4.5 0 117.495 4.692c-.755.758-1.707 1.154-2.723 1.154H15m-3 4.5h.008v.008H12v-.008z"
              />
            </svg>
            <span className="mt-5">
              <span className="block text-sm font-semibold text-text">
                {t("installationGuide")}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">
                {t("installGuideDesc")}
              </span>
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}

function InstallCopyMethod({
  icon,
  title,
  description,
  command,
}: {
  icon: string;
  title: string;
  description: string;
  command: string;
}) {
  return (
    <div className="flex min-h-32 flex-col rounded-lg border border-border bg-bg-elevated p-4">
      <span className="font-mono text-sm font-semibold text-muted">{icon}</span>
      <div className="mb-4 mt-5">
        <span className="block text-sm font-semibold text-text">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted">
          {description}
        </span>
      </div>
      <CopyCommandButton
        command={command}
        label={title}
        grow={false}
        className="mt-auto w-full"
      />
    </div>
  );
}
