import { cn } from "@/lib/utils";

type LoadingTreatmentProps = {
  className?: string;
};

export function LoadingTreatment({ className }: LoadingTreatmentProps) {
  return (
    <div
      className={cn(
        "grid gap-3 rounded-[1.25rem] border border-border bg-surface-paper p-4 shadow-lift",
        className
      )}
      aria-hidden="true"
    >
      <div className="h-4 w-2/5 rounded-full bg-party-blue/25" />
      <div className="h-4 w-4/5 rounded-full bg-party-yellow/45" />
      <div className="h-4 w-3/5 rounded-full bg-party-orange/25" />
    </div>
  );
}
