import enContent from "../content/en.json" with { type: "json" };
import partyFixtures from "../content/party-fixtures.json" with { type: "json" };
import partyUiCopy from "../content/party-ui.json" with { type: "json" };
import scaffoldCopy from "../content/scaffold.json" with { type: "json" };
import viContent from "../content/vi.json" with { type: "json" };
import { z } from "zod";
import { ContentSchema } from "../lib/content/schema";
import { getMissingPaths } from "../lib/content/parity";
import { buildPartyConfigFromContent } from "../lib/party-engine/content-config";

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
const PartyFixtureSchema = z.object({
  schemaVersion: z.string(),
  developmentOnly: z.literal(true),
  settings: z.object({
    questionDurationSeconds: z.number().int().positive()
  }),
  guests: z.array(
    z.object({
      id: z.string().min(1),
      displayName: z.string().min(1),
      locale: z.enum(["en", "vi"])
    })
  ),
  questions: z.array(
    z.object({
      id: z.string().min(1),
      enabled: z.boolean(),
      sortOrder: z.number().int(),
      correctOptionId: z.string().min(1),
      assetId: z.string().optional(),
      prompt: z.object({
        en: z.string().min(1),
        vi: z.string().min(1)
      }),
      funFact: z.object({
        en: z.string().min(1),
        vi: z.string().min(1)
      }),
      options: z
        .array(
          z.object({
            id: z.string().min(1),
            label: z.object({
              en: z.string().min(1),
              vi: z.string().min(1)
            })
          })
        )
        .min(2)
    })
  )
});
const PartyUiCopySchema = z.object({
  en: z.record(z.string(), z.string().min(1)),
  vi: z.record(z.string(), z.string().min(1))
});
const parsedPartyFixtures = PartyFixtureSchema.safeParse(partyFixtures);
const parsedPartyUiCopy = PartyUiCopySchema.safeParse(partyUiCopy);

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

if (!parsedPartyFixtures.success) {
  console.error("Party fixture validation failed.");
  console.error(parsedPartyFixtures.error.flatten());
  process.exit(1);
}

if (!parsedPartyUiCopy.success) {
  console.error("Party UI copy validation failed.");
  console.error(parsedPartyUiCopy.error.flatten());
  process.exit(1);
}

const fixtureQuestionIds = new Set<string>();
for (const question of parsedPartyFixtures.data.questions) {
  if (fixtureQuestionIds.has(question.id)) {
    console.error(`Duplicate party fixture question id: ${question.id}`);
    process.exit(1);
  }

  fixtureQuestionIds.add(question.id);

  const optionIds = new Set(question.options.map((option) => option.id));

  if (!optionIds.has(question.correctOptionId)) {
    console.error(`Party fixture question ${question.id} has missing correct option.`);
    process.exit(1);
  }
}

const missingPartyUiInVietnamese = getMissingPaths(partyUiCopy.en, partyUiCopy.vi);
const missingPartyUiInEnglish = getMissingPaths(partyUiCopy.vi, partyUiCopy.en);

if (missingPartyUiInVietnamese.length > 0 || missingPartyUiInEnglish.length > 0) {
  console.error("Party UI copy shape mismatch.");
  console.error({ missingPartyUiInVietnamese, missingPartyUiInEnglish });
  process.exit(1);
}

const missingInVietnamese = getMissingPaths(enContent, viContent);
const missingInEnglish = getMissingPaths(viContent, enContent);

if (missingInVietnamese.length > 0 || missingInEnglish.length > 0) {
  console.error("Locale content shape mismatch.");
  console.error({ missingInVietnamese, missingInEnglish });
  process.exit(1);
}

try {
  buildPartyConfigFromContent(enContent, viContent);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Approved quiz content validation failed.");
  process.exit(1);
}

console.log("Content schemas and locale key parity are valid.");
