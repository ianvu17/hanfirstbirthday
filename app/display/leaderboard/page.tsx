import { MonitorUp } from "lucide-react";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { DecorativeHeading } from "@/components/design/decorative-heading";
import { PageShell } from "@/components/design/page-shell";
import { PaperPanel } from "@/components/design/paper-panel";
import { getDisplayScaffoldCopy } from "@/lib/content/scaffold";

export default function DisplayLeaderboardPage() {
  const scaffoldCopy = getDisplayScaffoldCopy();

  return (
    <PageShell variant="display" decorations={false}>
      <section className="mx-auto grid w-full max-w-6xl gap-8">
        <DecorativeHeading
          align="center"
          size="display"
          eyebrow={
            <BirthdayBadge tone="blue">
              <MonitorUp className="h-4 w-4" aria-hidden="true" />
              {scaffoldCopy.eyebrow}
            </BirthdayBadge>
          }
          title={scaffoldCopy.title}
          description={scaffoldCopy.description}
        />

        <PaperPanel tone="display" className="mx-auto w-full max-w-5xl p-5 sm:p-8">
          <div className="mb-5 flex justify-center">
            <BirthdayBadge tone="yellow">{scaffoldCopy.statusLabel}</BirthdayBadge>
          </div>
          <div className="grid gap-4">
            {scaffoldCopy.rows.map((row) => (
              <div
                key={row.rank}
                className="grid grid-cols-[5rem_1fr_6rem] items-center gap-4 rounded-[1.25rem] border border-border bg-surface-paper px-5 py-4 text-2xl font-extrabold shadow-lift sm:grid-cols-[7rem_1fr_8rem] sm:text-4xl"
              >
                <span className="font-display text-party-orange">{row.rank}</span>
                <span className="truncate text-foreground">{row.name}</span>
                <span className="text-right font-display text-party-blue-deep">
                  {row.score}
                </span>
              </div>
            ))}
          </div>
        </PaperPanel>
      </section>
    </PageShell>
  );
}
