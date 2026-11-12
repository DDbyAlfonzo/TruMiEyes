import { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { getServerSession } from "next-auth";
import { ArrowDown, ArrowLeft, ArrowUp, Check, Loader2, Plus, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { authOptions } from "../../api/auth/[...nextauth]";
import { readApiJson } from "../../../lib/clientApi";
import { uploadFileWithProgress } from "../../../lib/uploadClient";
import { cn } from "../../../lib/utils";
import {
  MAX_PAGES,
  SLOT_PRESETS,
  countSlots,
  detectSlotsFromImage,
  type Orientation,
  type Slot,
} from "../../../lib/booklets";
import { AppShell } from "../../../components/AppShell";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { SlotEditor } from "../../../components/booklet/SlotEditor";
import { BookletPage } from "../../../components/booklet/BookletPage";

type DraftPage = {
  key: string;
  localUrl: string;
  path: string | null;
  status: "uploading" | "ready" | "failed";
  slots: Slot[];
  detected: boolean;
};

const ORIENTATIONS: { value: Orientation; label: string }[] = [
  { value: "PORTRAIT", label: "Portrait" },
  { value: "LANDSCAPE", label: "Landscape" },
  { value: "SQUARE", label: "Square" },
];

export default function NewBookletPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [orientation, setOrientation] = useState<Orientation>("PORTRAIT");
  const [pages, setPages] = useState<DraftPage[]>([]);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => () => pages.forEach((page) => URL.revokeObjectURL(page.localUrl)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const patchPage = (key: string, update: Partial<DraftPage>) =>
    setPages((prev) => prev.map((page) => (page.key === key ? { ...page, ...update } : page)));

  const addFiles = (files: FileList | File[]) => {
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!images.length) {
      toast.error("Choose photos or scans of your sketches (JPG or PNG).");
      return;
    }
    const room = MAX_PAGES - pages.length;
    const accepted = images.slice(0, room);
    const fresh: DraftPage[] = accepted.map((file, i) => ({
      key: `${Date.now()}-${i}-${file.name}`,
      localUrl: URL.createObjectURL(file),
      path: null,
      status: "uploading",
      slots: [],
      detected: false,
    }));
    setPages((prev) => [...prev, ...fresh]);
    setActive(pages.length);

    fresh.forEach(async (page, i) => {
      // Turn the sketch into slots straight away, while it uploads.
      detectSlotsFromImage(page.localUrl)
        .then((slots) => patchPage(page.key, { slots: slots.length ? slots : SLOT_PRESETS[1].slots, detected: slots.length > 0 }))
        .catch(() => patchPage(page.key, { slots: SLOT_PRESETS[1].slots }));
      try {
        const upload = await uploadFileWithProgress(accepted[i], () => undefined);
        patchPage(page.key, { path: upload.path, status: "ready" });
      } catch {
        patchPage(page.key, { status: "failed" });
      }
    });
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const current = pages[active];
  const totalSlots = countSlots(pages);
  const uploading = pages.some((page) => page.status === "uploading");
  const failed = pages.some((page) => page.status === "failed");
  const emptyPage = pages.findIndex((page) => page.slots.length === 0);
  const canSave = Boolean(name.trim()) && pages.length > 0 && !uploading && !failed && emptyPage === -1 && !saving;

  const movePage = (from: number, to: number) => {
    if (to < 0 || to >= pages.length) return;
    setPages((prev) => {
      const next = [...prev];
      const [page] = next.splice(from, 1);
      next.splice(to, 0, page);
      return next;
    });
    setActive(to);
  };

  const removePage = (index: number) => {
    URL.revokeObjectURL(pages[index].localUrl);
    setPages((prev) => prev.filter((_, i) => i !== index));
    setActive((value) => Math.max(0, Math.min(value, pages.length - 2)));
  };

  const redetect = async () => {
    if (!current) return;
    const slots = await detectSlotsFromImage(current.localUrl).catch(() => []);
    if (slots.length) {
      patchPage(current.key, { slots, detected: true });
      toast.success(`Found ${slots.length} photo box${slots.length === 1 ? "" : "es"} in your sketch.`);
    } else {
      toast.error("Couldn't spot closed boxes in this sketch. Draw the slots on the page or pick a layout below.");
    }
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await readApiJson(
        await fetch("/api/admin/layouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            orientation,
            pages: pages.map((page) => ({ sketchPath: page.path, slots: page.slots })),
          }),
        }),
        "Couldn't save the booklet.",
      );
      toast.success("Booklet saved. Assign it to a project to offer it to clients.");
      router.push("/admin/layouts");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save the booklet.");
      setSaving(false);
    }
  };

  return (
    <AppShell
      role="admin"
      title="New booklet"
      eyebrow="Layouts"
      actions={
        <Link href="/admin/layouts" className="hidden h-10 items-center gap-2 rounded-full px-3 text-sm text-zinc-300 hover:text-white sm:inline-flex">
          <ArrowLeft size={16} /> All booklets
        </Link>
      }
    >
      <div className="mb-8">
        <p className="page-kicker">Sketch to booklet</p>
        <h2 className="editorial-title mt-3">Turn your sketch into a booklet.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Upload a photo or scan of each page you've sketched. Boxes you've drawn become photo slots automatically — adjust them on the page,
          then save. Clients see their favourites flow into these pages.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">Booklet name</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Classic wedding album" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-zinc-300">Short description</span>
              <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. 30×20 cm, linen cover" />
            </label>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm text-zinc-300">Page shape</legend>
              <div className="grid grid-cols-3 gap-2">
                {ORIENTATIONS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={orientation === item.value}
                    onClick={() => setOrientation(item.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-xs transition",
                      orientation === item.value ? "border-brand-red bg-brand-red/10 text-white" : "border-line text-zinc-400 hover:border-zinc-500",
                    )}
                  >
                    <span
                      className="block border border-current"
                      style={{ width: item.value === "LANDSCAPE" ? 30 : item.value === "SQUARE" ? 22 : 18, height: item.value === "LANDSCAPE" ? 20 : item.value === "SQUARE" ? 22 : 24 }}
                    />
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between px-2 pb-3 pt-1">
              <p className="page-kicker">Pages · {pages.length}</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={pages.length >= MAX_PAGES}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs text-zinc-200 hover:border-brand-red/60 disabled:opacity-40"
              >
                <Plus size={14} /> Add sketches
              </button>
            </div>
            {pages.length === 0 ? (
              <p className="px-2 pb-2 text-xs leading-5 text-muted">Your pages will line up here in booklet order.</p>
            ) : (
              <ol className="grid max-h-[480px] grid-cols-3 gap-2 overflow-y-auto p-1">
                {pages.map((page, i) => (
                  <li key={page.key}>
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-current={i === active}
                      aria-label={`Page ${i + 1}`}
                      className={cn("relative block w-full rounded-lg p-1 transition", i === active ? "bg-brand-red/20 ring-1 ring-brand-red" : "hover:bg-white/5")}
                    >
                      <BookletPage orientation={orientation} slots={page.slots} sketchUrl={page.localUrl} showSketch />
                      <span className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
                        {i + 1}
                        {page.status === "uploading" && <Loader2 size={11} className="animate-spin" />}
                        {page.status === "failed" && <span className="text-red-300">failed</span>}
                        {page.status === "ready" && page.slots.length > 0 && <span>{page.slots.length}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <Card className="p-5 md:p-8">
          <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={onPick} />
          {current ? (
            <SlotEditor
              key={current.key + orientation}
              orientation={orientation}
              sketchUrl={current.localUrl}
              slots={current.slots}
              onChange={(slots) => patchPage(current.key, { slots })}
            />
          ) : (
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              tabIndex={0}
              onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && inputRef.current?.click()}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex min-h-[460px] cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border border-dashed px-6 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-brand-red/50",
                dragging ? "border-brand-red bg-brand-red/10" : "border-line bg-black/20 hover:border-brand-red/50",
              )}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/15 text-brand-red">
                <UploadCloud size={26} />
              </span>
              <span className="font-display text-2xl font-light text-white">Drop your sketches here</span>
              <span className="max-w-sm text-sm leading-6 text-muted">
                One photo or scan per page, in order. Draw each photo as a closed box in dark pen for the best result.
              </span>
            </label>
          )}
        </Card>

        <div className="space-y-6">
          {current && (
            <Card className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <p className="page-kicker">Page {active + 1}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label="Move page earlier" onClick={() => movePage(active, active - 1)} disabled={active === 0}>
                    <ArrowUp size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Move page later"
                    onClick={() => movePage(active, active + 1)}
                    disabled={active === pages.length - 1}
                  >
                    <ArrowDown size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Remove page" onClick={() => removePage(active)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              {current.detected && (
                <p className="flex items-start gap-2 rounded-2xl bg-emerald-500/10 p-3 text-xs leading-5 text-emerald-100">
                  <Check size={14} className="mt-0.5 shrink-0" /> Slots found in your sketch. Drag to fine-tune.
                </p>
              )}
              <Button variant="outline" className="w-full" onClick={redetect}>
                <Sparkles size={15} /> Detect from sketch
              </Button>
              <div className="space-y-2">
                <p className="text-xs text-muted">Or start from</p>
                <div className="grid grid-cols-3 gap-2">
                  {SLOT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      title={preset.name}
                      aria-label={preset.name}
                      onClick={() => patchPage(current.key, { slots: preset.slots, detected: false })}
                      className="rounded-lg p-1.5 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/60"
                    >
                      <BookletPage orientation={orientation} slots={preset.slots} />
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          <Card className="space-y-4 p-5">
            <p className="page-kicker">Booklet</p>
            <p className="text-sm text-zinc-300">
              <span className="text-2xl font-light text-white">{totalSlots}</span> photos across {pages.length} page{pages.length === 1 ? "" : "s"}
            </p>
            {emptyPage >= 0 && <p className="text-xs text-amber-200">Page {emptyPage + 1} needs at least one photo slot.</p>}
            {failed && <p className="text-xs text-red-300">A sketch didn't upload. Remove that page and add it again.</p>}
            <Button className="w-full" onClick={save} disabled={!canSave}>
              {saving ? "Saving…" : uploading ? "Uploading sketches…" : "Save booklet"}
            </Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: {} };
};
