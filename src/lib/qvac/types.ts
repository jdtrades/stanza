import type { Song } from "@/lib/songs";

export type CowriteAction =
  | "continue"
  | "chorus"
  | "rewrite"
  | "draft"
  | "title";

export interface CowriteSongPayload {
  title: string;
  genre: string;
  mood: string;
  key: string;
  bpm: number;
  notes: string;
  sections: { kind: string; label: string; lyrics: string }[];
}

export interface CowriteRequest {
  action: CowriteAction;
  song: CowriteSongPayload;
  focusSectionIndex: number;
  instruction?: string;
}

export type CowriteEvent =
  | { type: "status"; message: string }
  | { type: "backend"; name: "qvac" }
  | { type: "progress"; percentage: number; downloaded: number; total: number }
  | { type: "token"; text: string }
  | { type: "done"; text: string }
  | { type: "error"; message: string };

export function songToPayload(song: Song): CowriteSongPayload {
  return {
    title: song.title,
    genre: song.genre,
    mood: song.mood,
    key: song.key,
    bpm: song.bpm,
    notes: song.notes,
    sections: song.sections.map((s) => ({
      kind: s.kind,
      label: s.label,
      lyrics: s.lyrics,
    })),
  };
}

export const ACTION_LABELS: Record<CowriteAction, string> = {
  continue: "Continue this section",
  chorus: "Write a chorus",
  rewrite: "Rewrite this section",
  draft: "Draft the whole song",
  title: "Suggest titles",
};
