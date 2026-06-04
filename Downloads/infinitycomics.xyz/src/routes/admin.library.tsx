import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRole } from "@/hooks/use-role";
import {
  adminListComics,
  upsertComic,
  deleteComic,
} from "@/lib/comics.functions";
import {
  adminListCards,
  upsertCard,
  deleteCard,
  upsertCardSet,
  deleteCardSet,
} from "@/lib/cards.functions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_ASSET_BUCKET ?? "assets";
const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

async function uploadLocalImages(
  files: FileList | File[],
  prefix: string,
  onProgress?: (uploaded: number, total: number, filename?: string) => void
) {
  const list = Array.from(files);
  if (list.length === 0) throw new Error("No files selected.");

  const urls: string[] = [];
  for (let index = 0; index < list.length; index += 1) {
    const file = list[index];
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      throw new Error("Only JPG, PNG, WEBP, and GIF files are supported.");
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      throw new Error(`File is too large: ${Math.round(file.size / 1024 / 1024)} MB. Maximum is 15 MB.`);
    }
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
    const path = `${prefix}/${Date.now()}-${index}-${sanitizedName}`;
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: signed, error: signedError } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signedError || !signed?.signedUrl) throw signedError ?? new Error("Could not generate signed URL.");
    urls.push(signed.signedUrl);
    if (onProgress) onProgress(index + 1, list.length, file.name);
  }
  return urls;
}

export const Route = createFileRoute("/admin/library")({
  component: AdminLibrary,
  head: () => ({ meta: [{ title: "Library Admin — Captain Infinity" }] }),
});

function AdminLibrary() {
  const { isAdmin, loading } = useRole();
  const [showBulk, setShowBulk] = useState(false);
  if (loading) {
    return <div className="min-h-[60vh] grid place-items-center text-muted-foreground">…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-center px-6">
        <div>
          <h1 className="font-display text-3xl text-gold">Owner & Admins only</h1>
          <p className="mt-3 text-muted-foreground">This is the comic + card vault.</p>
          <Link to="/" className="mt-6 inline-block border border-gold/60 text-gold px-6 py-3 text-xs uppercase tracking-[0.3em]">
            Back home
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen max-w-6xl mx-auto px-6 py-16">
      <div className="mb-8">
        <p className="text-[0.6rem] tracking-[0.4em] uppercase text-gold/70">Architect Library</p>
        <h1 className="mt-2 font-display text-4xl text-gold glow-gold">Comics, Cards & Schedule</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload covers, art, and pages from local image files or paste CDN URLs. Set a release date to schedule, or release immediately.
        </p>
        <div className="mt-6 rounded-lg border border-gold/20 bg-gradient-to-r from-background/60 to-gold/5 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-gold">Bulk Upload & Asset Manager</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">Upload many images at once, choose where they go (comics pages, covers, card art, or set covers), and get signed asset URLs automatically.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowBulk((s) => !s)} className="bg-gold text-primary-foreground px-6 py-3 text-sm font-semibold tracking-[0.25em] uppercase shadow-lg hover:brightness-105 transition">
              {showBulk ? "Hide Bulk Upload" : "Bulk Upload Assets"}
            </button>
            <Link to="/" className="border border-gold/60 text-gold px-4 py-3 text-sm uppercase tracking-[0.2em]">Back site</Link>
          </div>
        </div>
      </div>
      {showBulk && <BulkUpload />}
      <Tabs defaultValue="comics">
        <TabsList>
          <TabsTrigger value="comics">Comics</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="sets">Card Sets</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>
        <TabsContent value="comics"><ComicsAdmin /></TabsContent>
        <TabsContent value="cards"><CardsAdmin /></TabsContent>
        <TabsContent value="sets"><SetsAdmin /></TabsContent>
        <TabsContent value="schedule"><ScheduleView /></TabsContent>
      </Tabs>
    </div>
  );
}

function BulkUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [prefix, setPrefix] = useState("comics/pages");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ name: string; uploaded: number; total: number }[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [mappingMode, setMappingMode] = useState<"none" | "cards" | "comics">("none");
  const [csvMode, setCsvMode] = useState<"cards" | "comics" | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const csvRef = useRef<HTMLInputElement | null>(null);
  const qc = useQueryClient();

  function handleFiles(flist: FileList | null) {
    if (!flist) return;
    setFiles(Array.from(flist));
    setProgress([]);
  }

  async function handleCsv(flist: FileList | null) {
    if (!flist?.[0]) return;
    const file = flist[0];
    const text = await file.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) { toast.error("CSV must have header + at least 1 row"); return; }
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = cols[i] ?? ""; });
      return obj;
    });
    setCsvData(rows);
    toast.success(`Parsed ${rows.length} rows from CSV.`);
  }

  async function bulkCreateFromCsv() {
    if (!csvData.length || !csvMode) return;
    let created = 0;
    let failed = 0;
    if (csvMode === "cards") {
      for (const row of csvData) {
        try {
          const payload = {
            set_code: (row.set_code || "INF1").toUpperCase(),
            card_number: Number(row.card_number || 1),
            name: row.name || "Unnamed",
            rarity: row.rarity || "common",
            element: row.element || null,
            power_text: row.power_text || "",
            lore: row.lore || "",
            art_url: row.art_url || null,
            status: row.status || "draft",
            release_at: row.release_at || null,
          };
          await upsertCard({ data: payload });
          created += 1;
        } catch (e) { failed += 1; console.error(e); }
      }
      qc.invalidateQueries({ queryKey: ["admin", "cards"] });
      qc.invalidateQueries({ queryKey: ["cards"] });
    } else if (csvMode === "comics") {
      for (const row of csvData) {
        try {
          const payload = {
            issue_number: Number(row.issue_number || 1),
            title: row.title || "Untitled",
            subtitle: row.subtitle || "",
            synopsis: row.synopsis || "",
            cover_url: row.cover_url || null,
            status: row.status || "draft",
            release_at: row.release_at || null,
            pages: [],
          };
          await upsertComic({ data: payload });
          created += 1;
        } catch (e) { failed += 1; console.error(e); }
      }
      qc.invalidateQueries({ queryKey: ["admin", "comics"] });
      qc.invalidateQueries({ queryKey: ["comics"] });
    }
    toast.success(`Created ${created} records${failed ? ` (${failed} failed)` : ""}`);
    setCsvData([]);
    setCsvMode(null);
  }

  async function doUpload() {
    if (files.length === 0) return;
    setUploading(true);
    setProgress([]);
    try {
      // onProgress will be called per-file by uploadLocalImages
      const urls = await uploadLocalImages(files, prefix, (uploaded, total, filename) => {
        setProgress((p) => {
          const next = p.filter((x) => x.name !== (filename ?? ""));
          next.push({ name: filename ?? `file-${uploaded}`, uploaded, total });
          return next;
        });
      });
      toast.success(`Uploaded ${urls.length} assets.`);
      // copy signed urls to clipboard for convenience
      try { await navigator.clipboard.writeText(urls.join("\n")); toast.success("Signed URLs copied to clipboard."); } catch {}
      // Optionally auto-create records based on filename conventions
      if (mappingMode === "cards") {
        for (let i = 0; i < urls.length; i += 1) {
          const url = urls[i];
          const name = files[i]?.name ?? "";
          const m = name.match(/^([A-Z0-9]+)_(\d+)_([^\.]+)\./i);
          if (!m) continue;
          const set_code = m[1].toUpperCase();
          const card_number = Number(m[2]);
          const cardName = m[3].replace(/[_-]+/g, " ");
          try {
            await upsertCard({ data: { set_code, card_number, name: cardName, rarity: "common", art_url: url, status: "draft" } });
          } catch (e: any) {
            console.error("Failed creating card", e);
          }
        }
        qc.invalidateQueries({ queryKey: ["admin","cards"] });
        qc.invalidateQueries({ queryKey: ["cards"] });
        toast.success("Created card records where filename matched.");
      } else if (mappingMode === "comics") {
        // group by issue number and create/update comics with pages or covers
        const byIssue: Record<string, string[]> = {};
        const covers: Record<string, string> = {};
        for (let i = 0; i < urls.length; i += 1) {
          const url = urls[i];
          const name = files[i]?.name ?? "";
          const coverMatch = name.match(/issue[_-]?(\d+).*cover/i);
          const pageMatch = name.match(/issue[_-]?(\d+).*page[_-]?(\d+)/i);
          const issueMatch = name.match(/issue[_-]?(\d+)/i);
          const issue = pageMatch?.[1] ?? coverMatch?.[1] ?? issueMatch?.[1];
          if (!issue) continue;
          if (coverMatch) {
            covers[issue] = url;
            continue;
          }
          if (!byIssue[issue]) byIssue[issue] = [];
          byIssue[issue].push(url);
        }
        for (const issue of Object.keys(byIssue)) {
          try {
            const pages = (byIssue[issue] || []).map((u) => ({ url: u, caption: "" }));
            const payload: any = { issue_number: Number(issue), title: `Issue ${issue}`, pages, status: "draft", cover_url: covers[issue] ?? null };
            await upsertComic({ data: payload });
          } catch (e: any) { console.error("Failed upserting comic issue", issue, e); }
        }
        qc.invalidateQueries({ queryKey: ["admin","comics"] });
        qc.invalidateQueries({ queryKey: ["comics"] });
        toast.success("Created/updated comic drafts where filename matched.");
      }
      setFiles([]);
    } catch (e: any) {
      toast.error(e.message ?? "Bulk upload failed.");
    } finally { setUploading(false); }
  }

  return (
    <div className="mt-6 border border-gold/20 bg-card/20 p-6 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <label className="block text-xs text-muted-foreground">Destination</label>
          <select value={prefix} onChange={(e) => setPrefix(e.target.value)} className="mt-1 bg-background border border-gold/30 px-3 py-2">
            <option value="comics/pages">comics/pages</option>
            <option value="comics/covers">comics/covers</option>
            <option value="cards/art">cards/art</option>
            <option value="card-sets/covers">card-sets/covers</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          <button onClick={() => fileRef.current?.click()} className="border border-gold/30 text-gold px-4 py-2">Select files</button>
          <button onClick={doUpload} disabled={uploading || files.length===0} className="bg-gold text-primary-foreground px-4 py-2 font-semibold">{uploading ? "Uploading…" : "Start Upload"}</button>
        </div>
      </div>
        <div className="mt-4">
        <div className="mt-3 flex items-center gap-3">
          <label className="text-xs text-muted-foreground">Auto-create:</label>
          <select value={mappingMode} onChange={(e) => setMappingMode(e.target.value as any)} className="bg-background border border-gold/30 px-2 py-1">
            <option value="none">None</option>
            <option value="cards">Cards (SETCODE_number_name.ext)</option>
            <option value="comics">Comics (issueN_pageM or issueN_cover)</option>
          </select>
        </div>
        <div className="mt-4 pt-4 border-t border-gold/10">
          <h3 className="font-display text-sm text-gold mb-3">Or import from CSV</h3>
          <div className="flex items-center gap-3 mb-3">
            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleCsv(e.target.files)} />
            <button onClick={() => csvRef.current?.click()} className="border border-gold/30 text-gold px-3 py-1.5 text-xs">Choose CSV</button>
            <select value={csvMode ?? ""} onChange={(e) => setCsvMode(e.target.value as any || null)} className="bg-background border border-gold/30 px-2 py-1 text-xs">
              <option value="">Select type…</option>
              <option value="cards">Cards</option>
              <option value="comics">Comics</option>
            </select>
            <button onClick={bulkCreateFromCsv} disabled={!csvData.length || !csvMode} className="bg-gold text-primary-foreground px-3 py-1.5 text-xs font-semibold disabled:opacity-50">Create {csvData.length} records</button>
          </div>
          {csvData.length > 0 && (
            <div className="text-xs text-muted-foreground bg-background/40 p-2 rounded max-h-40 overflow-auto">
              <p className="font-semibold text-gold mb-1">Preview ({csvData.length} rows):</p>
              <table className="text-[0.7rem] w-full">
                <tbody>
                  {csvData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-gold/10">
                      <td className="px-1 py-0.5 font-mono text-foreground/60">{JSON.stringify(row).slice(0, 60)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {files.length === 0 ? <p className="text-sm text-muted-foreground">No files selected.</p> : (
          <div className="space-y-2">
            {files.map((f) => {
              const p = progress.find((x) => x.name === f.name);
              return (
                <div key={f.name} className="flex items-center justify-between border border-gold/10 px-3 py-2 rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-background grid place-items-center overflow-hidden"><img src={URL.createObjectURL(f)} className="h-full w-full object-cover" /></div>
                    <div>
                      <div className="font-medium text-sm text-gold">{f.name}</div>
                      <div className="text-xs text-muted-foreground">{Math.round(f.size/1024)} KB</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p ? `${p.uploaded}/${p.total}` : "pending"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────── Comics ──────────────────────────
function ComicsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin","comics"], queryFn: () => adminListComics() });
  const comics = data?.comics ?? [];
  const [editing, setEditing] = useState<any | null>(null);

  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-6 mt-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl text-gold">Issues</h2>
          <button
            onClick={() => setEditing({ issue_number: (comics.at(-1)?.issue_number ?? 0) + 1, title: "", subtitle: "", cover_url: "", synopsis: "", pages: [], status: "draft", release_at: null })}
            className="bg-gold text-primary-foreground px-4 py-2 text-[0.6rem] tracking-[0.3em] uppercase"
          >
            New Issue
          </button>
        </div>
        <div className="space-y-2">
          {comics.length === 0 && <p className="text-sm text-muted-foreground">No issues yet.</p>}
          {comics.map((c: any) => (
            <div key={c.id} className="border border-gold/20 p-3 flex items-center gap-3">
              <div className="w-12 aspect-[2/3] bg-background border border-gold/30 overflow-hidden grid place-items-center">
                {c.cover_url ? <img src={c.cover_url} className="h-full w-full object-cover" /> : <span className="text-gold/30">∞</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.55rem] tracking-[0.3em] uppercase text-gold/60">#{c.issue_number} · {c.status}</div>
                <div className="font-display text-gold truncate">{c.title}</div>
                <div className="text-[0.6rem] text-muted-foreground">
                  {c.release_at ? new Date(c.release_at).toLocaleString() : "no date"}
                </div>
              </div>
              <button onClick={() => setEditing(c)} className="text-[0.6rem] tracking-[0.3em] uppercase text-gold border border-gold/40 px-3 py-1.5 hover:bg-gold/10">Edit</button>
              <button
                onClick={async () => { if (confirm(`Delete issue #${c.issue_number}?`)) { await deleteComic({ data: { id: c.id } }); qc.invalidateQueries({ queryKey: ["admin","comics"] }); qc.invalidateQueries({ queryKey: ["comics"] }); } }}
                className="text-[0.6rem] tracking-[0.3em] uppercase text-destructive border border-destructive/40 px-3 py-1.5"
              >
                Del
              </button>
            </div>
          ))}
        </div>
      </div>
      <div>
        {editing ? <ComicForm initial={editing} onClose={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin","comics"] }); qc.invalidateQueries({ queryKey: ["comics"] }); }} /> : <p className="text-sm text-muted-foreground">Select an issue or create a new one.</p>}
      </div>
    </div>
  );
}

function ComicForm({ initial, onClose }: { initial: any; onClose: () => void }) {
  const [form, setForm] = useState(initial);
  const [pagesText, setPagesText] = useState(JSON.stringify(form.pages ?? [], null, 2));
  const [saving, setSaving] = useState(false);
  const coverUploadRef = useRef<HTMLInputElement | null>(null);
  const pagesUploadRef = useRef<HTMLInputElement | null>(null);

  async function uploadCoverFiles(files: FileList | null) {
    if (!files?.length) return;
    try {
      toast.dismiss();
      const urls = await uploadLocalImages(files, "comics/covers");
      setForm({ ...form, cover_url: urls[0] ?? form.cover_url });
      toast.success(`Uploaded ${urls.length} image(s). Cover URL set.`);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed.");
    }
  }

  async function uploadPageFiles(files: FileList | null) {
    if (!files?.length) return;
    try {
      toast.dismiss();
      const urls = await uploadLocalImages(files, "comics/pages");
      const pages = urls.map((url) => ({ url, caption: "" }));
      setPagesText(JSON.stringify(pages, null, 2));
      toast.success(`Uploaded ${urls.length} page image(s) and updated pages JSON.`);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed.");
    }
  }

  async function save() {
    setSaving(true);
    try {
      let pages: any[] = [];
      try { pages = JSON.parse(pagesText); } catch { toast.error("Pages JSON is invalid"); setSaving(false); return; }
      const payload: any = {
        ...form,
        pages,
        issue_number: Number(form.issue_number),
        release_at: form.release_at || null,
        cover_url: form.cover_url || null,
      };
      if (!initial.id) delete payload.id;
      await upsertComic({ data: payload });
      toast.success("Saved");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setSaving(false); }
  }

  return (
    <div className="border border-gold/30 bg-card/30 p-4 space-y-3">
      <h3 className="font-display text-lg text-gold">{initial.id ? "Edit Issue" : "New Issue"}</h3>
      <Field label="Issue #" value={form.issue_number} onChange={(v) => setForm({ ...form, issue_number: v })} type="number" />
      <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
      <Field label="Subtitle" value={form.subtitle} onChange={(v) => setForm({ ...form, subtitle: v })} />
      <Field label="Cover URL" value={form.cover_url ?? ""} onChange={(v) => setForm({ ...form, cover_url: v })} placeholder="Paste a CDN/asset URL" />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => coverUploadRef.current?.click()}
          className="border border-gold/30 text-gold px-3 py-2 text-[0.65rem] uppercase tracking-[0.25em] hover:bg-gold/10"
        >
          Upload cover image
        </button>
        <span className="text-[0.65rem] text-muted-foreground">Or paste a URL above.</span>
      </div>
      <input
        ref={coverUploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => uploadCoverFiles(e.target.files)}
      />
      <FieldArea label="Synopsis" value={form.synopsis} onChange={(v) => setForm({ ...form, synopsis: v })} />
      <FieldArea label='Pages JSON: [{"url":"...","caption":"..."}]' value={pagesText} onChange={setPagesText} rows={6} />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => pagesUploadRef.current?.click()}
          className="border border-gold/30 text-gold px-3 py-2 text-[0.65rem] uppercase tracking-[0.25em] hover:bg-gold/10"
        >
          Upload page images
        </button>
        <span className="text-[0.65rem] text-muted-foreground">Select one or more page images to generate pages JSON.</span>
      </div>
      <input
        ref={pagesUploadRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => uploadPageFiles(e.target.files)}
      />
      <Field label="Release date/time (ISO, e.g. 2026-06-19T12:00:00Z)" value={form.release_at ?? ""} onChange={(v) => setForm({ ...form, release_at: v })} placeholder="leave blank to keep as draft" />
      <label className="block text-xs">
        Status:{" "}
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="bg-background border border-gold/30 px-2 py-1 ml-2">
          <option value="draft">draft</option>
          <option value="scheduled">scheduled</option>
          <option value="released">released</option>
        </select>
      </label>
      <div className="flex gap-2 pt-2">
        <button onClick={save} disabled={saving} className="bg-gold text-primary-foreground px-4 py-2 text-[0.6rem] tracking-[0.3em] uppercase disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        <button onClick={onClose} className="border border-gold/40 text-gold px-4 py-2 text-[0.6rem] tracking-[0.3em] uppercase">Close</button>
      </div>
    </div>
  );
}

// ────────────────────────── Cards ──────────────────────────
function CardsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin","cards"], queryFn: () => adminListCards() });
  const cards = data?.cards ?? [];
  const [editing, setEditing] = useState<any | null>(null);

  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-6 mt-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl text-gold">Cards</h2>
          <button onClick={() => setEditing({ set_code: "INF1", card_number: 1, name: "", rarity: "common", element: "", power_text: "", art_url: "", lore: "", status: "draft", release_at: null })} className="bg-gold text-primary-foreground px-4 py-2 text-[0.6rem] tracking-[0.3em] uppercase">New Card</button>
        </div>
        <div className="space-y-2">
          {cards.length === 0 && <p className="text-sm text-muted-foreground">No cards yet.</p>}
          {cards.map((c: any) => (
            <div key={c.id} className="border border-gold/20 p-3 flex items-center gap-3">
              <div className="w-10 aspect-[3/4] bg-background border border-gold/30 overflow-hidden grid place-items-center">
                {c.art_url ? <img src={c.art_url} className="h-full w-full object-cover" /> : <span className="text-gold/30">∞</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.55rem] tracking-[0.3em] uppercase text-gold/60">{c.set_code} #{c.card_number} · {c.rarity} · {c.status}</div>
                <div className="font-display text-gold truncate">{c.name}</div>
              </div>
              <button onClick={() => setEditing(c)} className="text-[0.6rem] uppercase tracking-[0.3em] text-gold border border-gold/40 px-3 py-1.5">Edit</button>
              <button onClick={async () => { if (confirm("Delete card?")) { await deleteCard({ data: { id: c.id } }); qc.invalidateQueries({ queryKey: ["admin","cards"] }); qc.invalidateQueries({ queryKey: ["cards"] }); } }} className="text-[0.6rem] uppercase tracking-[0.3em] text-destructive border border-destructive/40 px-3 py-1.5">Del</button>
            </div>
          ))}
        </div>
      </div>
      <div>{editing ? <CardForm initial={editing} onClose={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin","cards"] }); qc.invalidateQueries({ queryKey: ["cards"] }); }} /> : <p className="text-sm text-muted-foreground">Select a card or create a new one.</p>}</div>
    </div>
  );
}

function CardForm({ initial, onClose }: { initial: any; onClose: () => void }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const artUploadRef = useRef<HTMLInputElement | null>(null);

  async function uploadArtFiles(files: FileList | null) {
    if (!files?.length) return;
    try {
      toast.dismiss();
      const urls = await uploadLocalImages(files, "cards/art");
      setForm({ ...form, art_url: urls[0] ?? form.art_url });
      toast.success(`Uploaded ${urls.length} image(s). Art URL set.`);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed.");
    }
  }

  async function save() {
    setSaving(true);
    try {
      const payload: any = { ...form, card_number: Number(form.card_number), release_at: form.release_at || null, art_url: form.art_url || null, element: form.element || null };
      if (!initial.id) delete payload.id;
      await upsertCard({ data: payload });
      toast.success("Saved");
      onClose();
    } catch (e: any) { toast.error(e.message ?? "Failed"); } finally { setSaving(false); }
  }
  return (
    <div className="border border-gold/30 bg-card/30 p-4 space-y-3">
      <h3 className="font-display text-lg text-gold">{initial.id ? "Edit Card" : "New Card"}</h3>
      <Field label="Set code" value={form.set_code} onChange={(v) => setForm({ ...form, set_code: v })} />
      <Field label="Card #" value={form.card_number} onChange={(v) => setForm({ ...form, card_number: v })} type="number" />
      <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
      <label className="block text-xs">
        Rarity:{" "}
        <select value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })} className="bg-background border border-gold/30 px-2 py-1 ml-2">
          {["common","uncommon","rare","ultra","secret","legendary"].map(r => <option key={r}>{r}</option>)}
        </select>
      </label>
      <Field label="Element" value={form.element ?? ""} onChange={(v) => setForm({ ...form, element: v })} />
      <Field label="Art URL" value={form.art_url ?? ""} onChange={(v) => setForm({ ...form, art_url: v })} />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => artUploadRef.current?.click()}
          className="border border-gold/30 text-gold px-3 py-2 text-[0.65rem] uppercase tracking-[0.25em] hover:bg-gold/10"
        >
          Upload art image
        </button>
        <span className="text-[0.65rem] text-muted-foreground">Or paste a URL above.</span>
      </div>
      <input
        ref={artUploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => uploadArtFiles(e.target.files)}
      />
      <FieldArea label="Power text" value={form.power_text} onChange={(v) => setForm({ ...form, power_text: v })} />
      <FieldArea label="Lore" value={form.lore} onChange={(v) => setForm({ ...form, lore: v })} />
      <Field label="Release ISO" value={form.release_at ?? ""} onChange={(v) => setForm({ ...form, release_at: v })} />
      <label className="block text-xs">
        Status:{" "}
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="bg-background border border-gold/30 px-2 py-1 ml-2">
          <option value="draft">draft</option><option value="scheduled">scheduled</option><option value="released">released</option>
        </select>
      </label>
      <div className="flex gap-2 pt-2">
        <button onClick={save} disabled={saving} className="bg-gold text-primary-foreground px-4 py-2 text-[0.6rem] tracking-[0.3em] uppercase disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        <button onClick={onClose} className="border border-gold/40 text-gold px-4 py-2 text-[0.6rem] tracking-[0.3em] uppercase">Close</button>
      </div>
    </div>
  );
}

// ────────────────────────── Sets ──────────────────────────
function SetsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin","cards"], queryFn: () => adminListCards() });
  const sets = data?.sets ?? [];
  const [editing, setEditing] = useState<any | null>(null);
  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-6 mt-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl text-gold">Card Sets</h2>
          <button onClick={() => setEditing({ code: "INF1", name: "", kind: "starter", cover_url: "", price_cents: null, buy_url: "", status: "draft", release_at: null })} className="bg-gold text-primary-foreground px-4 py-2 text-[0.6rem] tracking-[0.3em] uppercase">New Set</button>
        </div>
        <div className="space-y-2">
          {sets.map((s: any) => (
            <div key={s.id} className="border border-gold/20 p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-[0.55rem] tracking-[0.3em] uppercase text-gold/60">{s.code} · {s.kind} · {s.status}</div>
                <div className="font-display text-gold">{s.name}</div>
              </div>
              <button onClick={() => setEditing(s)} className="text-[0.6rem] uppercase tracking-[0.3em] text-gold border border-gold/40 px-3 py-1.5">Edit</button>
              <button onClick={async () => { if (confirm("Delete set?")) { await deleteCardSet({ data: { id: s.id } }); qc.invalidateQueries({ queryKey: ["admin","cards"] }); qc.invalidateQueries({ queryKey: ["cards"] }); } }} className="text-[0.6rem] uppercase tracking-[0.3em] text-destructive border border-destructive/40 px-3 py-1.5">Del</button>
            </div>
          ))}
        </div>
      </div>
      <div>{editing ? <SetForm initial={editing} onClose={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin","cards"] }); qc.invalidateQueries({ queryKey: ["cards"] }); }} /> : <p className="text-sm text-muted-foreground">Select a set or create a new one.</p>}</div>
    </div>
  );
}

function SetForm({ initial, onClose }: { initial: any; onClose: () => void }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const coverUploadRef = useRef<HTMLInputElement | null>(null);

  async function uploadCoverFiles(files: FileList | null) {
    if (!files?.length) return;
    try {
      toast.dismiss();
      const urls = await uploadLocalImages(files, "card-sets/covers");
      setForm({ ...form, cover_url: urls[0] ?? form.cover_url });
      toast.success(`Uploaded ${urls.length} image(s). Cover URL set.`);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed.");
    }
  }

  async function save() {
    setSaving(true);
    try {
      const payload: any = { ...form, price_cents: form.price_cents ? Number(form.price_cents) : null, release_at: form.release_at || null, cover_url: form.cover_url || null, buy_url: form.buy_url || null };
      if (!initial.id) delete payload.id;
      await upsertCardSet({ data: payload });
      toast.success("Saved");
      onClose();
    } catch (e: any) { toast.error(e.message ?? "Failed"); } finally { setSaving(false); }
  }
  return (
    <div className="border border-gold/30 bg-card/30 p-4 space-y-3">
      <h3 className="font-display text-lg text-gold">{initial.id ? "Edit Set" : "New Set"}</h3>
      <Field label="Code" value={form.code} onChange={(v) => setForm({ ...form, code: v })} />
      <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
      <label className="block text-xs">
        Kind:{" "}
        <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="bg-background border border-gold/30 px-2 py-1 ml-2">
          <option value="starter">starter</option><option value="booster">booster</option><option value="collector">collector</option>
        </select>
      </label>
      <Field label="Cover URL" value={form.cover_url ?? ""} onChange={(v) => setForm({ ...form, cover_url: v })} />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => coverUploadRef.current?.click()}
          className="border border-gold/30 text-gold px-3 py-2 text-[0.65rem] uppercase tracking-[0.25em] hover:bg-gold/10"
        >
          Upload cover image
        </button>
        <span className="text-[0.65rem] text-muted-foreground">Or paste a URL above.</span>
      </div>
      <input
        ref={coverUploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => uploadCoverFiles(e.target.files)}
      />
      <Field label="Price (cents)" value={form.price_cents ?? ""} onChange={(v) => setForm({ ...form, price_cents: v })} type="number" />
      <Field label="Buy URL (Shopify/Stripe link)" value={form.buy_url ?? ""} onChange={(v) => setForm({ ...form, buy_url: v })} />
      <Field label="Release ISO" value={form.release_at ?? ""} onChange={(v) => setForm({ ...form, release_at: v })} />
      <label className="block text-xs">
        Status:{" "}
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="bg-background border border-gold/30 px-2 py-1 ml-2">
          <option value="draft">draft</option><option value="scheduled">scheduled</option><option value="released">released</option>
        </select>
      </label>
      <div className="flex gap-2 pt-2">
        <button onClick={save} disabled={saving} className="bg-gold text-primary-foreground px-4 py-2 text-[0.6rem] tracking-[0.3em] uppercase disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        <button onClick={onClose} className="border border-gold/40 text-gold px-4 py-2 text-[0.6rem] tracking-[0.3em] uppercase">Close</button>
      </div>
    </div>
  );
}

// ────────────────────────── Schedule ──────────────────────────
function ScheduleView() {
  const comics = useQuery({ queryKey: ["admin","comics"], queryFn: () => adminListComics() });
  const cards = useQuery({ queryKey: ["admin","cards"], queryFn: () => adminListCards() });
  const items: any[] = [
    ...((comics.data?.comics ?? []).map((c: any) => ({ kind: "Comic", label: `#${c.issue_number} · ${c.title}`, when: c.release_at, status: c.status }))),
    ...((cards.data?.cards ?? []).map((c: any) => ({ kind: "Card", label: `${c.set_code} #${c.card_number} · ${c.name}`, when: c.release_at, status: c.status }))),
    ...((cards.data?.sets ?? []).map((s: any) => ({ kind: "Set", label: `${s.code} · ${s.name}`, when: s.release_at, status: s.status }))),
  ];
  items.sort((a, b) => (a.when ?? "z").localeCompare(b.when ?? "z"));
  return (
    <div className="mt-6 border border-gold/20">
      <table className="w-full text-sm">
        <thead className="bg-gold/10 text-[0.55rem] tracking-[0.3em] uppercase text-gold/80">
          <tr><th className="text-left p-3">When</th><th className="text-left p-3">Kind</th><th className="text-left p-3">Item</th><th className="text-left p-3">Status</th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="border-t border-gold/10">
              <td className="p-3 font-mono text-xs">{it.when ? new Date(it.when).toLocaleString() : "—"}</td>
              <td className="p-3">{it.kind}</td>
              <td className="p-3">{it.label}</td>
              <td className="p-3 text-[0.6rem] tracking-[0.3em] uppercase text-gold/70">{it.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ────────────────────────── Field helpers ──────────────────────────
function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: any; onChange: (v: any) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-[0.6rem] tracking-[0.3em] uppercase text-gold/70 mb-1">{label}</span>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} className="w-full bg-background border border-gold/30 focus:border-gold/70 px-3 py-2 text-sm" />
    </label>
  );
}
function FieldArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="block text-[0.6rem] tracking-[0.3em] uppercase text-gold/70 mb-1">{label}</span>
      <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full bg-background border border-gold/30 focus:border-gold/70 px-3 py-2 text-sm font-mono" />
    </label>
  );
}
