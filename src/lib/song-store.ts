import { create } from "zustand";
import {
  newSection,
  newSong,
  SEED_SONGS,
  type SectionKind,
  type Song,
} from "./songs";

const STORAGE_KEY = "stanza.songs.v1";

interface SongState {
  songs: Song[];
  activeId: string;
  focusSectionId: string;
  setActive: (id: string) => void;
  setFocusSection: (id: string) => void;
  createSong: () => void;
  deleteSong: (id: string) => void;
  updateSong: (id: string, patch: Partial<Song>) => void;
  updateSection: (
    songId: string,
    sectionId: string,
    patch: Partial<Song["sections"][number]>,
  ) => void;
  addSection: (songId: string, kind: SectionKind) => void;
  removeSection: (songId: string, sectionId: string) => void;
  replaceSections: (songId: string, sections: Song["sections"]) => void;
  hydrateFromStorage: () => void;
}

function touch(song: Song, patch: Partial<Song>): Song {
  return { ...song, ...patch, updatedAt: Date.now() };
}

export const useSongStore = create<SongState>((set, get) => ({
  songs: SEED_SONGS,
  activeId: SEED_SONGS[0]!.id,
  focusSectionId: SEED_SONGS[0]!.sections[0]!.id,
  setActive: (id) => {
    const song = get().songs.find((s) => s.id === id);
    set({
      activeId: id,
      focusSectionId: song?.sections[0]?.id ?? get().focusSectionId,
    });
  },
  setFocusSection: (id) => set({ focusSectionId: id }),
  createSong: () => {
    const song = newSong();
    set({
      songs: [song, ...get().songs],
      activeId: song.id,
      focusSectionId: song.sections[0]!.id,
    });
  },
  deleteSong: (id) => {
    const songs = get().songs.filter((s) => s.id !== id);
    const next = songs[0] ?? newSong();
    const list = songs.length ? songs : [next];
    set({
      songs: list,
      activeId: list[0]!.id,
      focusSectionId: list[0]!.sections[0]!.id,
    });
  },
  updateSong: (id, patch) =>
    set({
      songs: get().songs.map((s) => (s.id === id ? touch(s, patch) : s)),
    }),
  updateSection: (songId, sectionId, patch) =>
    set({
      songs: get().songs.map((song) =>
        song.id !== songId
          ? song
          : touch(song, {
              sections: song.sections.map((section) =>
                section.id === sectionId ? { ...section, ...patch } : section,
              ),
            }),
      ),
    }),
  addSection: (songId, kind) => {
    const song = get().songs.find((s) => s.id === songId);
    if (!song) return;
    const count = song.sections.filter((s) => s.kind === kind).length + 1;
    const section = newSection(kind, "", count);
    set({
      songs: get().songs.map((s) =>
        s.id === songId
          ? touch(s, { sections: [...s.sections, section] })
          : s,
      ),
      focusSectionId: section.id,
    });
  },
  removeSection: (songId, sectionId) => {
    const song = get().songs.find((s) => s.id === songId);
    if (!song || song.sections.length < 2) return;
    const sections = song.sections.filter((s) => s.id !== sectionId);
    set({
      songs: get().songs.map((s) =>
        s.id === songId ? touch(s, { sections }) : s,
      ),
      focusSectionId:
        get().focusSectionId === sectionId
          ? sections[0]!.id
          : get().focusSectionId,
    });
  },
  replaceSections: (songId, sections) =>
    set({
      songs: get().songs.map((s) =>
        s.id === songId ? touch(s, { sections }) : s,
      ),
      focusSectionId: sections[0]?.id ?? get().focusSectionId,
    }),
  hydrateFromStorage: () => {
    if (typeof localStorage === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        songs?: Song[];
        activeId?: string;
        focusSectionId?: string;
      };
      if (!parsed.songs?.length) return;
      const active =
        parsed.songs.find((s) => s.id === parsed.activeId) ?? parsed.songs[0]!;
      const focus =
        active.sections.find((s) => s.id === parsed.focusSectionId) ??
        active.sections[0];
      set({
        songs: parsed.songs,
        activeId: active.id,
        focusSectionId: focus?.id ?? active.sections[0]!.id,
      });
    } catch {
      // keep seed songs
    }
  },
}));

export function persistSongs() {
  if (typeof localStorage === "undefined") return;
  const { songs, activeId, focusSectionId } = useSongStore.getState();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ songs, activeId, focusSectionId }),
  );
}

useSongStore.subscribe(persistSongs);

export function useActiveSong() {
  return useSongStore((s) => s.songs.find((song) => song.id === s.activeId));
}
