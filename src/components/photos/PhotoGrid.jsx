import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ImageOff, Plus, RotateCcw, X } from "lucide-react";
import useConfirm from "../../hooks/useConfirm";
import api, { getErrorMessage } from "../../utils/api";
import { uploadPhoto } from "../../utils/photoUpload";
import { updateUser } from "../../utils/userSlice";
import { showToast } from "../../utils/toastSlice";

const photoKey = (p) => p.publicId ?? p.url;
let nextUploadId = 1;

function SortablePhoto({ photo, index, onDelete, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photoKey(photo),
    disabled,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative aspect-[3/4] rounded-2xl overflow-hidden bg-base-300 touch-manipulation ${
        isDragging ? "z-20 ring-2 ring-primary shadow-glow scale-105" : ""
      }`}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        aria-label={`Photo ${index + 1}. Drag to reorder.`}
        {...attributes}
        {...listeners}
      >
        <img src={photo.url} alt="" draggable={false} className="size-full object-cover pointer-events-none" />
      </button>
      {index === 0 && (
        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 font-mono text-[10px] text-accent pointer-events-none">
          main
        </span>
      )}
      <button
        type="button"
        className="absolute top-1.5 right-1.5 size-9 rounded-full bg-black/60 backdrop-blur grid place-items-center text-white"
        aria-label={`Delete photo ${index + 1}`}
        onClick={() => onDelete(photo, index)}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function UploadTile({ upload, onRetry, onDismiss }) {
  const failed = upload.status === "error";
  return (
    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-base-300">
      <img src={upload.preview} alt="" className="size-full object-cover opacity-50" />
      <div className="absolute inset-0 grid place-items-center px-2 pt-10 pb-2 text-center">
        {failed ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-error font-medium line-clamp-3">{upload.error}</p>
            <button type="button" className="btn btn-sm h-9 bg-base-100/90 border-0" onClick={() => onRetry(upload)}>
              <RotateCcw className="size-4" /> Retry
            </button>
          </div>
        ) : (
          <div
            className="radial-progress text-primary bg-black/40"
            style={{ "--value": Math.round(upload.progress * 100), "--size": "3.5rem", "--thickness": "4px" }}
            role="progressbar"
            aria-valuenow={Math.round(upload.progress * 100)}
          >
            <span className="text-xs font-mono text-white">{Math.round(upload.progress * 100)}%</span>
          </div>
        )}
      </div>
      {failed && (
        <button
          type="button"
          className="absolute top-1.5 right-1.5 size-9 rounded-full bg-black/60 grid place-items-center text-white"
          aria-label="Remove failed upload"
          onClick={() => onDismiss(upload)}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

// 2×3 photo grid: tap an empty tile to add, drag to reorder (first = main photo), × to delete.
// Talks to the /profile/photos endpoints directly and keeps the user in the store up to date.
function PhotoGrid({ meta }) {
  const dispatch = useDispatch();
  const photos = useSelector((state) => state.user.photos ?? []);
  const [uploads, setUploads] = useState([]);
  const [confirm, confirmModal] = useConfirm();
  const fileInput = useRef(null);
  const max = meta.limits.photos;
  const enabled = meta.photoUploadsEnabled;
  const free = max - photos.length - uploads.length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Revoke preview URLs when tiles go away.
  const previews = useRef(new Set());
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const patchUpload = (id, changes) =>
    setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...changes } : u)));

  const dropUpload = (upload) => {
    URL.revokeObjectURL(upload.preview);
    previews.current.delete(upload.preview);
    setUploads((list) => list.filter((u) => u.id !== upload.id));
  };

  const start = async (upload) => {
    patchUpload(upload.id, { status: "uploading", progress: 0, error: null });
    try {
      const data = await uploadPhoto(upload.file, {
        maxBytes: meta.limits.photoMaxBytes,
        onProgress: (p) => patchUpload(upload.id, { progress: Math.min(p, 0.97) }),
      });
      dispatch(updateUser(data));
      dropUpload(upload);
    } catch (err) {
      patchUpload(upload.id, { status: "error", error: err.response ? getErrorMessage(err) : err.message });
    }
  };

  const onFiles = (e) => {
    const files = [...e.target.files].slice(0, Math.max(free, 0));
    e.target.value = "";
    const fresh = files.map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      return { id: nextUploadId++, file, preview, progress: 0, status: "uploading", error: null };
    });
    setUploads((list) => [...list, ...fresh]);
    fresh.forEach(start);
  };

  const onDelete = async (photo, index) => {
    const ok = await confirm({
      title: "Delete this photo?",
      message: index === 0 && photos.length > 1 ? "Your next photo becomes the main one." : undefined,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      const params = photo.publicId ? { publicId: photo.publicId } : { index };
      const { data } = await api.delete("/profile/photos", { params });
      dispatch(updateUser(data));
    } catch (err) {
      dispatch(showToast("error", getErrorMessage(err)));
    }
  };

  const onDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = photos.findIndex((p) => photoKey(p) === active.id);
    const to = photos.findIndex((p) => photoKey(p) === over.id);
    const order = arrayMove(photos.map((_, i) => i), from, to);
    const previous = photos;
    dispatch(updateUser({ photos: arrayMove(photos, from, to) })); // optimistic
    try {
      const { data } = await api.patch("/profile/photos/order", { order });
      dispatch(updateUser(data));
    } catch (err) {
      dispatch(updateUser({ photos: previous }));
      dispatch(showToast("error", getErrorMessage(err)));
    }
  };

  const emptyTiles = Math.max(max - photos.length - uploads.length, 0);

  return (
    <div className="flex flex-col gap-3">
      {!enabled && (
        <div role="note" className="flex items-center gap-3 rounded-2xl bg-base-200 border border-white/5 p-4 text-sm text-muted">
          <ImageOff className="size-5 shrink-0" />
          Photo uploads aren't available right now.
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={photos.map(photoKey)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-2.5">
            {photos.map((photo, i) => (
              <SortablePhoto key={photoKey(photo)} photo={photo} index={i} onDelete={onDelete} />
            ))}
            {uploads.map((u) => (
              <UploadTile key={u.id} upload={u} onRetry={start} onDismiss={dropUpload} />
            ))}
            {Array.from({ length: emptyTiles }, (_, i) => (
              <button
                key={`empty${i}`}
                type="button"
                disabled={!enabled}
                onClick={() => fileInput.current?.click()}
                className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/15 bg-base-200 grid place-items-center text-muted enabled:hover:border-primary enabled:hover:text-primary disabled:opacity-40 transition-colors"
                aria-label="Add a photo"
              >
                <span className="size-9 rounded-full bg-brand grid place-items-center text-white shadow-glow">
                  <Plus className="size-5" strokeWidth={3} />
                </span>
              </button>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={onFiles} />
      {photos.length > 1 && <p className="text-xs text-muted text-center">Drag to reorder. The first photo is your main one.</p>}
      {confirmModal}
    </div>
  );
}

export default PhotoGrid;
