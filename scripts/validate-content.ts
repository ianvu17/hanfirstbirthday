import enContent from "../content/en.json" with { type: "json" };
import scaffoldCopy from "../content/scaffold.json" with { type: "json" };
import viContent from "../content/vi.json" with { type: "json" };
import { z } from "zod";
import { ContentSchema } from "../lib/content/schema";
import { getMissingPaths } from "../lib/content/parity";

const ScaffoldCopySchema = z.object({
  localeLabels: z.object({
    en: z.string().min(1),
    vi: z.string().min(1)
  }),
  common: z.object({
    assetPlaceholder: z.object({
      label: z.string().min(1),
      alt: z.string().min(1)
    })
  }),
  display: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    statusLabel: z.string().min(1),
    rows: z
      .array(
        z.object({
          rank: z.string().min(1),
          name: z.string().min(1),
          score: z.string().min(1)
        })
      )
      .min(1)
  }),
  en: z.object({
    guest: z.object({
      eyebrow: z.string().min(1),
      localeLabel: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      primaryAction: z.string().min(1),
      secondaryAction: z.string().min(1),
      timerLabel: z.string().min(1)
    }),
    admin: z.object({
      eyebrow: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      items: z.array(z.string().min(1)).min(1)
    }),
    qa: z.object({
      eyebrow: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      warning: z.string().min(1)
    }),
    designSystem: z.object({
      eyebrow: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      longCopy: z.string().min(1),
      sections: z.record(z.string(), z.string().min(1)),
      buttons: z.record(z.string(), z.string().min(1)),
      labels: z.record(z.string(), z.string().min(1))
    })
  }),
  vi: z.object({
    guest: z.object({
      eyebrow: z.string().min(1),
      localeLabel: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      primaryAction: z.string().min(1),
      secondaryAction: z.string().min(1),
      timerLabel: z.string().min(1)
    }),
    admin: z.object({
      eyebrow: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      items: z.array(z.string().min(1)).min(1)
    }),
    qa: z.object({
      eyebrow: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      warning: z.string().min(1)
    }),
    designSystem: z.object({
      eyebrow: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      longCopy: z.string().min(1),
      sections: z.record(z.string(), z.string().min(1)),
      buttons: z.record(z.string(), z.string().min(1)),
      labels: z.record(z.string(), z.string().min(1))
    })
  })
});

const parsedEnglish = ContentSchema.safeParse(enContent);
const parsedVietnamese = ContentSchema.safeParse(viContent);
const parsedScaffold = ScaffoldCopySchema.safeParse(scaffoldCopy);

if (!parsedEnglish.success) {
  console.error("English content schema validation failed.");
  console.error(parsedEnglish.error.flatten());
  process.exit(1);
}

if (!parsedVietnamese.success) {
  console.error("Vietnamese content schema validation failed.");
  console.error(parsedVietnamese.error.flatten());
  process.exit(1);
}

if (!parsedScaffold.success) {
  console.error("Scaffold copy schema validation failed.");
  console.error(parsedScaffold.error.flatten());
  process.exit(1);
}

const missingInVietnamese = getMissingPaths(enContent, viContent);
const missingInEnglish = getMissingPaths(viContent, enContent);

if (missingInVietnamese.length > 0 || missingInEnglish.length > 0) {
  console.error("Locale content shape mismatch.");
  console.error({ missingInVietnamese, missingInEnglish });
  process.exit(1);
}

console.log("Content schemas and locale key parity are valid.");
