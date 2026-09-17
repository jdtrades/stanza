import { ChevronDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GENRES, KEYS, MOODS, SECTION_KINDS, SECTION_LABELS } from "@/lib/songs";
import { useActiveSong, useSongStore } from "@/lib/song-store";
import { cn } from "@/lib/utils";

function MetaMenu({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-11 gap-1.5 px-3" aria-label={label}>
          <span className="text-muted-foreground">{label}</span>
          <span className="text-foreground">{value}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {options.map((option) => (
          <DropdownMenuItem key={option} onSelect={() => onChange(option)}>
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LyricDesk() {
  const song = useActiveSong();
  const focusSectionId = useSongStore((s) => s.focusSectionId);
  const setFocusSection = useSongStore((s) => s.setFocusSection);
  const updateSong = useSongStore((s) => s.updateSong);
  const updateSection = useSongStore((s) => s.updateSection);
  const addSection = useSongStore((s) => s.addSection);
  const removeSection = useSongStore((s) => s.removeSection);

  if (!song) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-6 sm:py-8">
      <header className="px-1">
        <Input
          value={song.title}
          onChange={(e) => updateSong(song.id, { title: e.target.value })}
          className="h-auto border-0 bg-transparent px-0 font-serif text-2xl text-foreground shadow-none focus-visible:ring-0 sm:text-4xl"
          aria-label="Song title"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <MetaMenu
            label="Genre"
            value={song.genre}
            options={GENRES}
            onChange={(genre) => updateSong(song.id, { genre })}
          />
          <MetaMenu
            label="Mood"
            value={song.mood}
            options={MOODS}
            onChange={(mood) => updateSong(song.id, { mood })}
          />
          <MetaMenu
            label="Key"
            value={song.key}
            options={KEYS}
            onChange={(key) => updateSong(song.id, { key })}
          />
          <label className="flex h-11 items-center gap-2 rounded-md border border-border px-3 text-xs text-muted-foreground">
            BPM
            <input
              type="number"
              min={40}
              max={220}
              value={song.bpm}
              onChange={(e) =>
                updateSong(song.id, { bpm: Number(e.target.value) || 0 })
              }
              className="w-12 bg-transparent text-foreground tabular-nums focus-visible:outline-none"
            />
          </label>
        </div>
      </header>

      <div className="paper-sheet rounded-xl px-4 py-5 sm:px-7 sm:py-7">
        <div className="flex flex-col gap-6">
          {song.sections.map((section) => {
            const focused = section.id === focusSectionId;
            return (
              <section
                key={section.id}
                className={cn("rounded-lg", focused && "ring-1 ring-ink/10")}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setFocusSection(section.id)}
                    className="font-sans text-xs font-medium tracking-[0.16em] text-ink/50 uppercase"
                  >
                    {section.label}
                  </button>
                  {song.sections.length > 1 && (
                    <button
                      type="button"
                      className="inline-flex size-8 items-center justify-center rounded-md text-ink/40 hover:text-ink"
                      aria-label={`Remove ${section.label}`}
                      onClick={() => removeSection(song.id, section.id)}
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                <Textarea
                  value={section.lyrics}
                  onFocus={() => setFocusSection(section.id)}
                  onChange={(e) =>
                    updateSection(song.id, section.id, { lyrics: e.target.value })
                  }
                  placeholder="Write the line. Leave space."
                  className="min-h-28 resize-none border-0 bg-transparent px-0 py-1 font-serif text-lg leading-8 text-ink shadow-none placeholder:text-ink/30 focus-visible:ring-0"
                />
              </section>
            );
          })}
        </div>
        <div className="mt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-ink/60 hover:bg-ink/5 hover:text-ink">
                <Plus />
                Add section
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {SECTION_KINDS.map((kind) => (
                <DropdownMenuItem
                  key={kind}
                  onSelect={() => addSection(song.id, kind)}
                >
                  {SECTION_LABELS[kind]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div>
        <p className="mb-2 px-1 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
          Desk notes
        </p>
        <Textarea
          value={song.notes}
          onChange={(e) => updateSong(song.id, { notes: e.target.value })}
          placeholder="Private notes. Never leave this machine."
          className="min-h-20 bg-card"
        />
      </div>
    </div>
  );
}
