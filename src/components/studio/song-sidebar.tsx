import { FilePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { songPreview } from "@/lib/songs";
import { useSongStore } from "@/lib/song-store";
import { cn } from "@/lib/utils";

export function SongSidebar({ onPick }: { onPick?: () => void }) {
  const songs = useSongStore((s) => s.songs);
  const activeId = useSongStore((s) => s.activeId);
  const setActive = useSongStore((s) => s.setActive);
  const createSong = useSongStore((s) => s.createSong);
  const deleteSong = useSongStore((s) => s.deleteSong);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Songs
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          onClick={() => {
            createSong();
            onPick?.();
          }}
          aria-label="New song"
        >
          <FilePlus />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <ul className="flex flex-col gap-1 px-2 pb-4">
          {songs.map((song) => (
            <li key={song.id}>
              <div
                className={cn(
                  "group flex items-start gap-1 rounded-lg px-2 py-2",
                  song.id === activeId ? "bg-secondary" : "hover:bg-secondary/60",
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 rounded-md px-1 py-1 text-left"
                  onClick={() => {
                    setActive(song.id);
                    onPick?.();
                  }}
                >
                  <span className="block truncate font-serif text-base text-foreground">
                    {song.title || "Untitled"}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {songPreview(song)}
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 shrink-0 opacity-70 hover:opacity-100"
                  aria-label={`Delete ${song.title}`}
                  onClick={() => deleteSong(song.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
