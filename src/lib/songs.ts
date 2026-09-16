import { uid } from "./utils";

export const SECTION_KINDS = [
  "intro",
  "verse",
  "prechorus",
  "chorus",
  "bridge",
  "hook",
  "outro",
  "note",
] as const;

export type SectionKind = (typeof SECTION_KINDS)[number];

export const SECTION_LABELS: Record<SectionKind, string> = {
  intro: "Intro",
  verse: "Verse",
  prechorus: "Pre-chorus",
  chorus: "Chorus",
  bridge: "Bridge",
  hook: "Hook",
  outro: "Outro",
  note: "Scratch",
};

export const GENRES = [
  "folk",
  "country",
  "indie",
  "r&b",
  "soul",
  "rock",
  "gospel",
  "hip-hop",
  "blues",
  "pop",
] as const;

export const MOODS = [
  "dusk",
  "tender",
  "defiant",
  "lonesome",
  "restless",
  "hush",
  "bitter",
  "joyful",
] as const;

export const KEYS = [
  "C",
  "G",
  "D",
  "A",
  "E",
  "F",
  "Am",
  "Em",
  "Dm",
  "Bm",
] as const;

export interface Section {
  id: string;
  kind: SectionKind;
  label: string;
  lyrics: string;
}

export interface Song {
  id: string;
  title: string;
  genre: string;
  mood: string;
  key: string;
  bpm: number;
  notes: string;
  sections: Section[];
  createdAt: number;
  updatedAt: number;
}

export function newSection(
  kind: SectionKind,
  lyrics = "",
  index?: number,
): Section {
  const base = SECTION_LABELS[kind];
  const label =
    kind === "verse" || kind === "chorus"
      ? `${base} ${index ?? 1}`
      : base;
  return { id: uid(), kind, label, lyrics };
}

export function newSong(partial?: Partial<Song>): Song {
  const now = Date.now();
  return {
    id: uid(),
    title: "Untitled",
    genre: "folk",
    mood: "dusk",
    key: "G",
    bpm: 84,
    notes: "",
    sections: [newSection("verse")],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export function songPreview(song: Song) {
  const line = song.sections
    .map((s) => s.lyrics)
    .join("\n")
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  return line ?? "Empty page";
}

export function exportSongText(song: Song) {
  const head = [
    song.title,
    [song.genre, song.mood, song.key, song.bpm ? `${song.bpm} bpm` : ""]
      .filter(Boolean)
      .join(" · "),
    "",
  ];
  const body = song.sections.flatMap((section) => [
    `[${section.label}]`,
    section.lyrics.trim() || "",
    "",
  ]);
  const notes = song.notes.trim()
    ? ["Notes", song.notes.trim(), ""]
    : [];
  return [...head, ...body, ...notes].join("\n").trim() + "\n";
}

export const SEED_SONGS: Song[] = [
  {
    id: "seed-wire-fence",
    title: "Wire Fence",
    genre: "folk",
    mood: "dusk",
    key: "G",
    bpm: 84,
    notes:
      "Keep the chorus almost spoken. Last line of verse 2 should land on 'gate'.",
    createdAt: 1_725_000_000_000,
    updatedAt: 1_725_003_600_000,
    sections: [
      {
        id: "seed-wire-v1",
        kind: "verse",
        label: "Verse 1",
        lyrics: [
          "The county road forgets its name after the last mailbox",
          "Wire fence leaning like it heard a secret and got tired",
          "Your jacket on the gatepost still smells like rain",
          "I count the posts instead of saying what I mean",
        ].join("\n"),
      },
      {
        id: "seed-wire-c",
        kind: "chorus",
        label: "Chorus",
        lyrics: [
          "Don't wait up, I know the way back",
          "I just like the long way when the light goes red",
          "If the porch light's on I'll take it as a maybe",
          "If it isn't, I'll still turn in at the bend",
        ].join("\n"),
      },
      {
        id: "seed-wire-v2",
        kind: "verse",
        label: "Verse 2",
        lyrics: "",
      },
    ],
  },
  {
    id: "seed-late-shift",
    title: "Late Shift",
    genre: "r&b",
    mood: "restless",
    key: "Am",
    bpm: 92,
    notes: "Half-time pocket. Leave space in the hook.",
    createdAt: 1_724_913_600_000,
    updatedAt: 1_724_992_000_000,
    sections: [
      {
        id: "seed-late-v1",
        kind: "verse",
        label: "Verse 1",
        lyrics: [
          "Clock on the wall doing nothing useful",
          "Coffee gone cold in a paper cup with your name",
          "I keep rewriting the text I never send",
        ].join("\n"),
      },
      {
        id: "seed-late-h",
        kind: "hook",
        label: "Hook",
        lyrics: "",
      },
    ],
  },
];
