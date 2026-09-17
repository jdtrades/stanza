import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cowriteStream, fetchQvacStatus, type QvacStatus } from "@/lib/cowrite-client";
import { ACTION_LABELS, songToPayload, type CowriteAction } from "@/lib/qvac/types";
import { parseDraftSections, stripModelChrome } from "@/lib/qvac/prompts";
import { newSection } from "@/lib/songs";
import { useActiveSong, useSongStore } from "@/lib/song-store";
import { cn } from "@/lib/utils";

const ACTIONS: CowriteAction[] = [
  "continue",
  "chorus",
  "rewrite",
  "draft",
  "title",
];

function statusForEngine(engine: QvacStatus | null) {
  if (!engine) return "Co-writer ready";
  if (engine.backend === "qvac" && engine.state.status === "ready") {
    return "Local co-writer · QVAC 0.19.1";
  }
  if (engine.backend === "none") return "Co-writer unavailable";
  return "Co-writer ready";
}

export function CowriterPanel() {
  const song = useActiveSong();
  const focusSectionId = useSongStore((s) => s.focusSectionId);
  const updateSection = useSongStore((s) => s.updateSection);
  const replaceSections = useSongStore((s) => s.replaceSections);
  const updateSong = useSongStore((s) => s.updateSong);
  const addSection = useSongStore((s) => s.addSection);

  const [instruction, setInstruction] = useState("");
  const [take, setTake] = useState("");
  const [status, setStatus] = useState("Co-writer ready");
  const [busy, setBusy] = useState(false);
  const [engine, setEngine] = useState<QvacStatus | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchQvacStatus()
      .then((next) => {
        setEngine(next);
        setStatus(statusForEngine(next));
      })
      .catch(() => undefined);
  }, []);

  const focusIndex = useMemo(() => {
    if (!song) return 0;
    const index = song.sections.findIndex((s) => s.id === focusSectionId);
    return index >= 0 ? index : 0;
  }, [song, focusSectionId]);

  async function run(action: CowriteAction) {
    if (!song || busy) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setTake("");
    setStatus("Starting…");

    let assembled = "";
    try {
      await cowriteStream(
        {
          action,
          song: songToPayload(song),
          focusSectionIndex: focusIndex,
          instruction,
        },
        (event) => {
          if (event.type === "backend") {
            setStatus("Writing on this machine");
          }
          if (event.type === "status") setStatus(event.message);
          if (event.type === "progress") {
            setStatus(`Downloading model ${Math.round(event.percentage)}%`);
          }
          if (event.type === "token") {
            assembled += event.text;
            setTake(assembled);
          }
          if (event.type === "done") {
            assembled = event.text;
            setTake(event.text);
            setStatus("Take ready");
          }
          if (event.type === "error") {
            setStatus("Co-writer unavailable");
            toast.error(event.message);
          }
        },
        controller.signal,
      );
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast.error("Could not reach the co-writer.");
      }
    } finally {
      setBusy(false);
    }
  }

  function insertTake(mode: "append" | "replace" | "draft" | "title") {
    if (!song || !take.trim()) return;
    const text = stripModelChrome(take);
    const focused = song.sections[focusIndex];
    if (mode === "title") {
      const first = text.split("\n").map((l) => l.trim()).find(Boolean);
      if (first) updateSong(song.id, { title: first.replace(/^\d+[\).\s-]+/, "") });
      return;
    }
    if (mode === "draft") {
      const parsed = parseDraftSections(text);
      replaceSections(
        song.id,
        parsed.map((section, i) =>
          newSection(section.kind, section.lyrics, i + 1),
        ),
      );
      return;
    }
    if (!focused) return;
    if (mode === "replace") {
      updateSection(song.id, focused.id, { lyrics: text });
      return;
    }
    const next = focused.lyrics.trim()
      ? `${focused.lyrics.trim()}\n${text}`
      : text;
    updateSection(song.id, focused.id, { lyrics: next });
  }

  function insertChorus() {
    if (!song || !take.trim()) return;
    const existing = song.sections.find((s) => s.kind === "chorus");
    if (existing) {
      updateSection(song.id, existing.id, {
        lyrics: stripModelChrome(take),
      });
      return;
    }
    addSection(song.id, "chorus");
    const latest = useSongStore.getState().songs.find((s) => s.id === song.id);
    const chorus = latest?.sections.find((s) => s.kind === "chorus");
    if (chorus) {
      updateSection(song.id, chorus.id, { lyrics: stripModelChrome(take) });
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-5 pb-3">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Co-writer
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Runs on this computer through Tether QVAC. Lyrics stay on the desk.
        </p>
        <p className="mt-2 text-xs text-subtle">{status}</p>
        {engine?.backend === "none" && engine.state.status === "error" && (
          <p className="mt-2 text-xs text-muted-foreground">
            {engine.state.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 px-4">
        {ACTIONS.map((action) => (
          <Button
            key={action}
            variant={action === "continue" ? "paper" : "outline"}
            className="justify-start"
            disabled={busy}
            onClick={() => run(action)}
          >
            {busy ? <LoaderCircle className="animate-spin" /> : <PenLine />}
            {ACTION_LABELS[action]}
          </Button>
        ))}
        <Textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Optional direction — more rain, shorter lines, no rhyme"
          className="min-h-16 text-sm"
        />
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col px-4 pb-4">
        <p className="mb-2 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
          Take
        </p>
        <ScrollArea className="min-h-40 flex-1 rounded-lg bg-paper">
          <pre
            className={cn(
              "whitespace-pre-wrap px-4 py-4 font-serif text-base leading-7 text-ink",
              !take && "text-ink/40",
            )}
          >
            {take || (busy ? "Listening…" : "A take will land here.")}
          </pre>
        </ScrollArea>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="paper"
            disabled={!take || busy}
            onClick={() => insertTake("append")}
          >
            Insert
          </Button>
          <Button
            variant="outline"
            disabled={!take || busy}
            onClick={() => insertTake("replace")}
          >
            Replace section
          </Button>
          <Button
            variant="outline"
            disabled={!take || busy}
            onClick={insertChorus}
          >
            Use as chorus
          </Button>
          <Button
            variant="outline"
            disabled={!take || busy}
            onClick={() => insertTake("draft")}
          >
            Use as song
          </Button>
        </div>
      </div>
    </div>
  );
}
