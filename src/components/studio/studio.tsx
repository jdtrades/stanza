import { useEffect, useState } from "react";
import { Copy, Download, Menu, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CowriterPanel } from "@/components/studio/cowriter";
import { LyricDesk } from "@/components/studio/lyric-desk";
import { SongSidebar } from "@/components/studio/song-sidebar";
import { exportSongText } from "@/lib/songs";
import { useActiveSong, useSongStore } from "@/lib/song-store";

export function Studio() {
  const [songsOpen, setSongsOpen] = useState(false);
  const [writerOpen, setWriterOpen] = useState(false);
  const song = useActiveSong();
  const hydrateFromStorage = useSongStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  function copySong() {
    if (!song) return;
    void navigator.clipboard.writeText(exportSongText(song));
    toast.success("Copied the chart");
  }

  function downloadSong() {
    if (!song) return;
    const blob = new Blob([exportSongText(song)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${song.title || "untitled"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-4">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          aria-label="Open songs"
          onClick={() => setSongsOpen(true)}
        >
          <Menu />
          Songs
        </Button>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-xl leading-none tracking-tight">Stanza</p>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            Private lyric desk
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={copySong} className="hidden sm:inline-flex">
          <Copy />
          Copy
        </Button>
        <Button variant="ghost" size="icon" onClick={downloadSong} aria-label="Download lyrics">
          <Download />
        </Button>
        <Button
          variant="paper"
          size="sm"
          className="xl:hidden"
          onClick={() => setWriterOpen(true)}
        >
          <PenLine />
          Write
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
          <SongSidebar />
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto px-4 sm:px-8">
          <LyricDesk />
        </main>
        <aside className="hidden w-80 shrink-0 border-l border-border xl:block">
          <CowriterPanel />
        </aside>
      </div>

      <Sheet open={songsOpen} onOpenChange={setSongsOpen}>
        <SheetContent side="left" title="Songs" className="pt-2">
          <SongSidebar onPick={() => setSongsOpen(false)} />
        </SheetContent>
      </Sheet>
      <Sheet open={writerOpen} onOpenChange={setWriterOpen}>
        <SheetContent side="bottom" title="Co-writer" className="h-5/6">
          <CowriterPanel />
        </SheetContent>
      </Sheet>
    </div>
  );
}
