import type { CowriteRequest } from "./types";

const SYSTEM = [
  "You are a working songwriter at a private desk.",
  "Write lyrics only. No commentary, no markdown, no quotation marks around the song, no bullet lists.",
  "Do not mention AI, models, or that you are an assistant.",
  "Keep lines singable: concrete images, short lines, natural speech-rhythm.",
  "Rhyme when it serves the song, never as a trick.",
  "Match the given genre, mood, key, and any existing lines in voice and diction.",
].join(" ");

function formatSong(req: CowriteRequest) {
  const { song } = req;
  const meta = [
    `Title: ${song.title || "Untitled"}`,
    `Genre: ${song.genre}`,
    `Mood: ${song.mood}`,
    `Key: ${song.key}`,
    `BPM: ${song.bpm}`,
  ].join("\n");
  const notes = song.notes.trim() ? `\nWriter notes: ${song.notes.trim()}` : "";
  const body = song.sections
    .map((section, i) => {
      const mark = i === req.focusSectionIndex ? " (current)" : "";
      const lyrics = section.lyrics.trim() || "(empty)";
      return `[${section.label}]${mark}\n${lyrics}`;
    })
    .join("\n\n");
  return `${meta}${notes}\n\n${body}`;
}

export function buildHistory(req: CowriteRequest): {
  role: "system" | "user";
  content: string;
}[] {
  const song = formatSong(req);
  const extra = req.instruction?.trim()
    ? `\nExtra direction from the writer: ${req.instruction.trim()}`
    : "";
  const focused =
    req.song.sections[req.focusSectionIndex] ?? req.song.sections[0];
  const focusName = focused?.label ?? "Verse";

  let task: string;
  switch (req.action) {
    case "continue":
      task = [
        `Write the next 6 to 10 lines for ${focusName} only.`,
        "Continue from the last written line. Do not repeat existing lines.",
        "Output lyrics only — no section header.",
      ].join(" ");
      break;
    case "chorus":
      task = [
        "Write a chorus of 4 to 8 lines that could be sung after these verses.",
        "Make it more memorable than the verses: shorter words, a repeating turn of phrase.",
        "Output lyrics only — no section header.",
      ].join(" ");
      break;
    case "rewrite":
      task = [
        `Rewrite ${focusName} in the same length, keeping the story, tightening the lines.`,
        "Output the new lyrics only — no section header.",
      ].join(" ");
      break;
    case "draft":
      task = [
        "Write a complete short song in this exact labeled format:",
        "",
        "[Verse 1]",
        "lines",
        "",
        "[Chorus]",
        "lines",
        "",
        "[Verse 2]",
        "lines",
        "",
        "[Chorus]",
        "lines",
        "",
        "Two verses and a repeated chorus is enough. Lyrics only besides those labels.",
      ].join("\n");
      break;
    case "title":
      task = [
        "Suggest 8 song titles, one per line, no numbering, no quotes.",
        "Titles should sound like they belong on a setlist, not a headline.",
      ].join(" ");
      break;
  }

  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: `${song}\n\n${task}${extra}` },
  ];
}

export function stripModelChrome(text: string) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^```(?:\w+)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^["“]|["”]$/g, "")
    .trim();
}

export function parseDraftSections(text: string) {
  const cleaned = stripModelChrome(text);
  const parts = cleaned.split(/^\[(.+?)\]\s*$/gm);
  if (parts.length < 3) {
    return [{ label: "Verse 1", kind: "verse" as const, lyrics: cleaned }];
  }
  const sections: { label: string; kind: "verse" | "chorus" | "bridge" | "hook" | "intro" | "outro" | "prechorus" | "note"; lyrics: string }[] =
    [];
  for (let i = 1; i < parts.length; i += 2) {
    const label = (parts[i] ?? "Verse").trim();
    const lyrics = (parts[i + 1] ?? "").trim();
    const lower = label.toLowerCase();
    let kind: (typeof sections)[number]["kind"] = "verse";
    if (lower.includes("chorus") || lower.includes("refrain")) kind = "chorus";
    else if (lower.includes("bridge")) kind = "bridge";
    else if (lower.includes("hook")) kind = "hook";
    else if (lower.includes("intro")) kind = "intro";
    else if (lower.includes("outro")) kind = "outro";
    else if (lower.includes("pre")) kind = "prechorus";
    sections.push({ label, kind, lyrics });
  }
  return sections.filter((s) => s.lyrics.length > 0);
}
