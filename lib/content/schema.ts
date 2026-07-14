import { z } from "zod";

const LocalizedStringSchema = z.string();

const NavigationSchema = z.object({
  home: LocalizedStringSchema,
  quiz: LocalizedStringSchema,
  leaderboard: LocalizedStringSchema,
  message: LocalizedStringSchema,
  timeline: LocalizedStringSchema,
  gallery: LocalizedStringSchema
});

const ScreensSchema = z.object({
  welcome: z.object({
    title: LocalizedStringSchema,
    subtitle: LocalizedStringSchema,
    primaryAction: LocalizedStringSchema,
    heroPlaceholderLabel: LocalizedStringSchema,
    heroPlaceholderAlt: LocalizedStringSchema
  }),
  language: z.object({
    title: LocalizedStringSchema,
    subtitle: LocalizedStringSchema,
    englishLabel: LocalizedStringSchema,
    englishDescription: LocalizedStringSchema,
    vietnameseLabel: LocalizedStringSchema,
    vietnameseDescription: LocalizedStringSchema,
    switchLabel: LocalizedStringSchema
  }),
  guestEntry: z.object({
    title: LocalizedStringSchema,
    description: LocalizedStringSchema,
    nameLabel: LocalizedStringSchema,
    namePlaceholder: LocalizedStringSchema,
    primaryAction: LocalizedStringSchema,
    validation: z.object({
      required: LocalizedStringSchema,
      tooLong: LocalizedStringSchema,
      alreadySubmitted: LocalizedStringSchema
    })
  }),
  howToPlay: z.object({
    title: LocalizedStringSchema,
    subtitle: LocalizedStringSchema,
    primaryAction: LocalizedStringSchema,
    cards: z.array(
      z.object({
        id: z.enum(["timer", "locked", "reveal"]),
        title: LocalizedStringSchema,
        description: LocalizedStringSchema
      })
    )
  }),
  ready: z.object({
    title: LocalizedStringSchema,
    subtitle: LocalizedStringSchema,
    primaryAction: LocalizedStringSchema
  }),
  quizPlaceholder: z.object({
    title: LocalizedStringSchema,
    description: LocalizedStringSchema,
    backAction: LocalizedStringSchema
  }),
  onboardingProgress: z.object({
    welcome: LocalizedStringSchema,
    language: LocalizedStringSchema,
    name: LocalizedStringSchema,
    howToPlay: LocalizedStringSchema,
    ready: LocalizedStringSchema
  }),
  quizStart: z.object({
    title: LocalizedStringSchema,
    description: LocalizedStringSchema,
    timerNotice: LocalizedStringSchema,
    primaryAction: LocalizedStringSchema
  }),
  quiz: z.object({
    questionCounterLabel: LocalizedStringSchema,
    timerLabel: LocalizedStringSchema,
    timeExpiredLabel: LocalizedStringSchema,
    nextAction: LocalizedStringSchema,
    submitAction: LocalizedStringSchema
  }),
  result: z.object({
    title: LocalizedStringSchema,
    scoreLabel: LocalizedStringSchema,
    leaderboardAction: LocalizedStringSchema,
    messageAction: LocalizedStringSchema
  }),
  leaderboard: z.object({
    title: LocalizedStringSchema,
    emptyTitle: LocalizedStringSchema,
    emptyDescription: LocalizedStringSchema
  }),
  message: z.object({
    title: LocalizedStringSchema,
    description: LocalizedStringSchema,
    fieldLabel: LocalizedStringSchema,
    fieldPlaceholder: LocalizedStringSchema,
    submitAction: LocalizedStringSchema,
    successTitle: LocalizedStringSchema,
    successDescription: LocalizedStringSchema
  }),
  timeline: z.object({
    title: LocalizedStringSchema,
    emptyTitle: LocalizedStringSchema,
    emptyDescription: LocalizedStringSchema
  }),
  gallery: z.object({
    title: LocalizedStringSchema,
    emptyTitle: LocalizedStringSchema,
    emptyDescription: LocalizedStringSchema
  }),
  errors: z.object({
    generic: LocalizedStringSchema,
    network: LocalizedStringSchema,
    retryAction: LocalizedStringSchema
  })
});

const QuizQuestionSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  sortOrder: z.number().int(),
  prompt: z.string(),
  answers: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      assetId: z.string().optional()
    })
  ),
  correctAnswerId: z.string(),
  funFact: z.string(),
  assetId: z.string().optional()
});

const AssetSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "audio", "icon", "illustration"]),
  src: z.string(),
  alt: z.string(),
  description: z.string(),
  status: z.enum(["placeholder", "provided", "approved"])
});

export const ContentSchema = z.object({
  schemaVersion: z.string(),
  locale: z.enum(["en", "vi"]),
  metadata: z.object({
    projectName: z.string(),
    publicTitle: z.string(),
    contentStatus: z.string(),
    contentRules: z.object({
      realContentRequiredFromIan: z.boolean(),
      inventedMemoriesAllowed: z.literal(false),
      fakePhotosAllowed: z.literal(false),
      hardcodedContentAllowed: z.literal(false)
    })
  }),
  navigation: NavigationSchema,
  screens: ScreensSchema,
  quiz: z.object({
    settings: z.object({
      questionDurationSeconds: z.number().int().positive(),
      responseLocking: z.literal("per-question-immutable"),
      questionOrder: z.literal("content-order"),
      scoringMode: z.literal("correct-count")
    }),
    questions: z.array(QuizQuestionSchema)
  }),
  timeline: z.object({
    entries: z.array(z.unknown())
  }),
  gallery: z.object({
    items: z.array(z.unknown())
  }),
  messages: z.object({
    constraints: z.object({
      minLength: z.number().int().nonnegative(),
      maxLength: z.number().int().positive()
    }),
    review: z.object({
      simpleStatusWorkflow: z.array(z.string())
    })
  }),
  assets: z.object({
    items: z.array(AssetSchema)
  }),
  admin: z.object({
    labels: z.object({
      dashboard: z.string(),
      submissions: z.string(),
      messages: z.string(),
      qaMode: z.string(),
      testData: z.string()
    })
  })
});

export type BirthdayContent = z.infer<typeof ContentSchema>;
