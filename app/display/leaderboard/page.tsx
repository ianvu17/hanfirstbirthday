import { MonitorUp } from "lucide-react";

import { getDisplayScaffoldCopy } from "@/lib/content/scaffold";

export default function DisplayLeaderboardPage() {
  const scaffoldCopy = getDisplayScaffoldCopy();

  return (
    <main className="paper-grid flex min-h-screen items-center justify-center px-8 py-10">
      <section className="w-full max-w-5xl rounded-[2rem] border border-border/70 bg-card/90 p-10 text-center shadow-paper backdrop-blur">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-primary text-primary-foreground shadow-lift">
          <MonitorUp className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="font-display text-5xl font-extrabold text-foreground">
          {scaffoldCopy.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-8 text-muted-foreground">
          {scaffoldCopy.description}
        </p>
      </section>
    </main>
  );
}
