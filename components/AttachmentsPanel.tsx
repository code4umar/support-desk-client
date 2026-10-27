'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/Toast';
import { timeAgo } from '@/lib/time';
import {
  ACCEPT, Attachment, deleteAttachment, fetchAttachmentBlob, formatBytes, listAttachments, uploadAttachment, validateFile,
} from '@/lib/attachments';

// image thumbnails need the sign-in token, so they are fetched as blobs (an <img src> cannot send headers)
function Thumb({ file }: { file: Attachment }) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = file.mime_type.startsWith('image/');

  useEffect(() => {
    if (!isImage) return;
    let alive = true;
    let objectUrl: string | null = null;
    fetchAttachmentBlob(file.id)
      .then((blob) => {
        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id, isImage]);

  if (isImage && url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={file.filename} className="h-12 w-12 shrink-0 rounded-lg border border-line object-cover" />;
  }
  const label = file.mime_type === 'application/pdf' ? 'PDF' : file.mime_type === 'text/csv' ? 'CSV' : file.mime_type.startsWith('image/') ? 'IMG' : 'TXT';
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-line bg-navy/5 text-[11px] font-bold tracking-wide text-brand-dark">
      {label}
    </span>
  );
}

export default function AttachmentsPanel({ ticketId, meId, isStaff }: { ticketId: number; meId?: number | string; isStaff: boolean }) {
  const { show } = useToast();
  const [files, setFiles] = useState<Attachment[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setFiles(await listAttachments(ticketId));
    } catch {
      setFiles([]);
    }
  }, [ticketId]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function addFiles(list: FileList | File[]) {
    const chosen = Array.from(list);
    if (chosen.length === 0) return;
    setBusy(true);
    let added = 0;
    for (const file of chosen) {
      const problem = validateFile(file);
      if (problem) {
        show(problem, 'error');
        continue;
      }
      try {
        const saved = await uploadAttachment(ticketId, file);
        setFiles((prev) => [...(prev ?? []), saved]);
        added++;
      } catch (e) {
        show((e as Error).message, 'error');
      }
    }
    if (added > 0) show(added === 1 ? 'File attached' : `${added} files attached`);
    setBusy(false);
    if (input.current) input.current.value = '';
  }

  async function download(file: Attachment) {
    try {
      const blob = await fetchAttachmentBlob(file.id);
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = file.filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (e) {
      show((e as Error).message, 'error');
    }
  }

  async function remove(file: Attachment) {
    if (!window.confirm(`Delete ${file.filename}?`)) return;
    try {
      await deleteAttachment(file.id);
      setFiles((prev) => (prev ?? []).filter((f) => f.id !== file.id));
      show('File deleted');
    } catch (e) {
      show((e as Error).message, 'error');
    }
  }

  const canDelete = (f: Attachment) => isStaff || String(f.uploaded_by) === String(meId);

  return (
    <div className="mt-6 rounded-xl border border-line bg-surface p-6 backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          Attachments {files && files.length > 0 && <span className="text-sm font-normal text-muted">({files.length})</span>}
        </h2>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="rounded-md border border-brand-dark/30 px-3 py-1.5 text-sm text-brand-dark transition-colors hover:bg-brand/15 disabled:opacity-50"
        >
          {busy ? 'Uploading…' : '+ Add file'}
        </button>
        <input ref={input} type="file" multiple accept={ACCEPT} aria-label="Choose a file" className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        className={`rounded-lg border border-dashed p-3 transition-colors ${drag ? 'border-brand-dark bg-brand/10' : 'border-line'}`}
      >
        {files === null ? (
          <p className="py-3 text-center text-sm text-muted">Loading…</p>
        ) : files.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted">No files yet. Drop a file here or use “Add file”. Images, PDF, TXT and CSV up to 2 MB.</p>
        ) : (
          <ul className="divide-y divide-line">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-3 py-2.5">
                <Thumb file={f} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy">{f.filename}</p>
                  <p className="text-xs text-muted">
                    {formatBytes(f.size)} · {f.uploader_name ?? 'Someone'} · {timeAgo(f.created_at)}
                  </p>
                </div>
                <button type="button" onClick={() => download(f)} className="rounded-md border border-line px-2.5 py-1 text-xs text-navy hover:border-brand-dark">
                  Download
                </button>
                {canDelete(f) && (
                  <button type="button" onClick={() => remove(f)} aria-label={`Delete ${f.filename}`} className="rounded-md border border-red-500/30 px-2.5 py-1 text-xs text-red-600 hover:bg-red-500/10 dark:text-red-400">
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
