"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { coverRoomPhotoAction, removeRoomPhotoAction, uploadRoomPhotoAction } from "../../actions";
import { StarIcon, TrashIcon, UploadIcon } from "../../icons";

/** Long side of an uploaded photo: as wide as the biggest image the booking page asks for. */
const MAX_SIDE = 1920;

/**
 * Shrinks a photo in the browser before it is sent: a phone photo of 6 MB becomes a JPEG of a few hundred KB, upright
 * (the camera's rotation is applied), so the upload is quick and the page that shows it stays fast.
 */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot prepare the photo.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The photo could not be prepared."))), "image/jpeg", 0.85));
}

/** "Add photos": one or several at a time, each shrunk, then sent one after the other. */
export function PhotoUpload({ roomTypeId, roomName }: { roomTypeId: string; roomName: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<{ kind: "busy" | "error" | "done"; text: string } | null>(null);
  const [, startTransition] = useTransition();
  const busy = status?.kind === "busy";

  async function upload(files: FileList | null) {
    const list = [...(files ?? [])].filter((file) => file.type.startsWith("image/"));
    if (list.length === 0) return;
    const problems: string[] = [];
    for (const [index, file] of list.entries()) {
      setStatus({ kind: "busy", text: list.length > 1 ? `Uploading ${index + 1} of ${list.length}…` : "Uploading…" });
      try {
        const form = new FormData();
        form.set("roomTypeId", roomTypeId);
        form.set("photo", await shrink(file), "photo.jpg");
        const result = await uploadRoomPhotoAction(form);
        if (!result.ok) problems.push(`${file.name}: ${result.message}`);
      } catch (error) {
        problems.push(`${file.name}: ${error instanceof Error ? error.message : "the upload failed."}`);
      }
    }
    if (input.current) input.current.value = "";
    setStatus(problems.length ? { kind: "error", text: problems.join(" ") } : { kind: "done", text: list.length > 1 ? `${list.length} photos added.` : "Photo added." });
    startTransition(() => router.refresh());
  }

  return (
    <div className="adm-photo-add">
      <label className={`adm-photo-drop${busy ? " is-busy" : ""}`}>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy}
          className="sr-only"
          aria-label={`Add photos of ${roomName}`}
          onChange={(event) => void upload(event.target.files)}
        />
        <UploadIcon />
        <span>{busy ? status.text : "Add photos"}</span>
        <small>JPEG, PNG or WebP</small>
      </label>
      {status && status.kind !== "busy" && (
        <p className={`adm-photo-status adm-photo-status--${status.kind}`} role={status.kind === "error" ? "alert" : "status"}>
          {status.text}
        </p>
      )}
    </div>
  );
}

/** One photo: the cover label or "Make cover", and Remove (asks first: an uploaded photo is deleted for good). */
export function PhotoTile({ roomTypeId, url, index, roomName }: { roomTypeId: string; url: string; index: number; roomName: string }) {
  const uploaded = url.startsWith("/media/");
  return (
    <li className="adm-photo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`${roomName}, photo ${index + 1}`} loading="lazy" />
      <div className="adm-photo-tools">
        {index === 0 ? (
          <span className="adm-photo-cover">
            <StarIcon /> Cover
          </span>
        ) : (
          <form action={coverRoomPhotoAction}>
            <input type="hidden" name="roomTypeId" value={roomTypeId} />
            <input type="hidden" name="url" value={url} />
            <button type="submit" className="adm-photo-btn" title="Show this photo first on the booking page">
              <StarIcon /> Make cover
            </button>
          </form>
        )}
        <form
          action={removeRoomPhotoAction}
          onSubmit={(event) => {
            const question = uploaded ? "Remove this photo? It is deleted and has to be uploaded again to come back." : "Remove this photo from the room?";
            if (!window.confirm(question)) event.preventDefault();
          }}
        >
          <input type="hidden" name="roomTypeId" value={roomTypeId} />
          <input type="hidden" name="url" value={url} />
          <button type="submit" className="adm-photo-btn adm-photo-btn--danger" aria-label={`Remove photo ${index + 1}`} title="Remove photo">
            <TrashIcon />
          </button>
        </form>
      </div>
    </li>
  );
}
