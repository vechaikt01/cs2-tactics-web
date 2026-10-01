import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus, X, Trash2, Pencil, Play, ChevronDown, ChevronRight,
  Search, Shield, Swords, Image as ImageIcon, Link2, MapPin,
  Loader2, Save, AlertTriangle, Crosshair, Download, Upload, Zap, Copy, Check
} from "lucide-react";

/* ---------------------------------------------------------
   TOKENS
   bg-base #0E1117 · bg-panel #141A22 · bg-card #1B232E
   border #2A3340 · ct #5B9BD5 · t #E0A458
   text #E8EAED · muted #8A93A3 · ok #6FCF97 · danger #E2574C
--------------------------------------------------------- */

const DEFAULT_MAPS = [
  "Dust2", "Mirage", "Inferno", "Nuke", "Ancient",
  "Anubis", "Overpass", "Vertigo", "Train",
];

const SIDE_META = {
  CT: { color: "#5B9BD5", label: "CT", icon: Shield },
  T: { color: "#E0A458", label: "T", icon: Swords },
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function parseYoutube(url) {
  if (!url) return null;
  try {
    let id = null, start = 0;
    const u = new URL(url.trim());
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.replace("/", "");
    } else if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v");
      if (!id && u.pathname.startsWith("/embed/")) id = u.pathname.split("/embed/")[1];
    }
    const t = u.searchParams.get("t");
    if (t) {
      if (/^\d+$/.test(t)) start = parseInt(t, 10);
      else {
        const hh = t.match(/(\d+)h/), mm = t.match(/(\d+)m/), ss = t.match(/(\d+)s/);
        start = (hh ? parseInt(hh[1]) * 3600 : 0) + (mm ? parseInt(mm[1]) * 60 : 0) + (ss ? parseInt(ss[1]) : 0);
      }
    }
    if (!id) return null;
    return { id, start };
  } catch {
    return null;
  }
}

// Embedding YouTube videos in an <iframe> inside Electron is unreliable —
// depending on the video's own embedding settings and the app's origin,
// it can fail with YouTube's "Error 153" overlay or a generic browser
// "This content is blocked" page. Rather than trying to embed at all,
// video links are always opened in the system's default browser, landing
// at the exact timestamp — this works for every video, every time.
function formatTimestamp(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// Áp một thứ tự mới cho một nhóm con (ví dụ các chiến thuật đang hiển thị
// của 1 map) vào đúng những vị trí mà nhóm đó đang chiếm trong danh sách
// đầy đủ — các chiến thuật thuộc map khác giữ nguyên vị trí, không bị xáo.
function applySubsetOrder(fullList, newOrderOfSubset) {
  const ids = new Set(newOrderOfSubset.map((t) => t.id));
  const indices = [];
  fullList.forEach((t, i) => { if (ids.has(t.id)) indices.push(i); });
  const next = [...fullList];
  indices.forEach((idx, i) => { next[idx] = newOrderOfSubset[i]; });
  return next;
}

function getVideoList(a) {
  if (Array.isArray(a.videoUrls) && a.videoUrls.length) return a.videoUrls;
  if (a.videoUrl) return [{ id: a.id + "_v0", url: a.videoUrl }];
  return [];
}

function normalizeImage(img) {
  if (typeof img === "string") return { id: img, src: img, caption: "" };
  return { id: img.id || img.src, src: img.src, caption: img.caption || "" };
}

function getAssignmentImages(a, tactic, isFirst) {
  if (Array.isArray(a.images) && a.images.length) return a.images.map(normalizeImage);
  if (isFirst && tactic.images?.length) return tactic.images.map(normalizeImage);
  return [];
}

// Trong bản web (khi window.storage.uploadImage tồn tại), ảnh/video được
// tải lên một nơi lưu trữ riêng (Cloudinary) thay vì nhúng thẳng base64
// vào dữ liệu — tránh làm phình dữ liệu và chạm giới hạn dung lượng mỗi
// bản ghi của database. Ở các bản khác (Windows, bản gốc trong Claude)
// không có hàm này, nên sẽ tự động giữ nguyên cách cũ (lưu thẳng base64).
async function hostImage(dataUrl) {
  if (typeof window !== "undefined" && window.storage?.uploadImage) {
    try {
      const hosted = await window.storage.uploadImage(dataUrl);
      if (hosted) return hosted;
    } catch {}
  }
  return dataUrl;
}

function compressImage(file, maxDim = 1920) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const isPng = file.type === "image/png";
        const localDataUrl = isPng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85);
        resolve(hostImage(localDataUrl));
      };
      img.onerror = () => reject(new Error("image decode failed"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}

function FontStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');

      .tac-root { font-family: 'Inter', sans-serif; background: #0E1117; color: #E8EAED; }
      .tac-root * { box-sizing: border-box; }
      .tac-display { font-family: 'Oswald', sans-serif; letter-spacing: 0.02em; }
      .tac-mono { font-family: 'JetBrains Mono', monospace; }

      .tac-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
      .tac-scroll::-webkit-scrollbar-track { background: transparent; }
      .tac-scroll::-webkit-scrollbar-thumb { background: #2A3340; border-radius: 4px; }

      .tac-mapbtn { transition: all .15s ease; }
      .tac-mapbtn:hover { background: #1B232E !important; }

      .tac-card { transition: border-color .15s ease, transform .15s ease; }
      .tac-card:hover { border-color: #3A4555 !important; }

      .tac-thumb { transition: transform .15s ease, border-color .15s ease; }
      .tac-thumb:hover { transform: scale(1.08); border-color: #5B9BD5 !important; z-index: 2; position: relative; }

      .tac-hover-pop { animation: tacHoverPop .12s ease; transform-origin: left center; }
      @keyframes tacHoverPop { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }

      .tac-iconbtn { transition: background .15s ease, color .15s ease; }
      .tac-iconbtn:hover { background: #232B36; }

      .tac-fade-in { animation: tacFadeIn .25s ease; }
      @keyframes tacFadeIn { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: translateY(0);} }
      @keyframes spin { to { transform: rotate(360deg);} }

      .tac-chip { transition: all .15s ease; cursor: pointer; }

      .tac-input::placeholder { color: #5C6573; }
      .tac-input:focus, .tac-textarea:focus { outline: none; border-color: #5B9BD5 !important; }

      @media (prefers-reduced-motion: reduce) {
        .tac-fade-in, .tac-mapbtn, .tac-card, .tac-iconbtn { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}

/* ---------------------------------------------------------
   STORAGE HOOK
--------------------------------------------------------- */
function useTacticsStore() {
  const [maps, setMaps] = useState(DEFAULT_MAPS);
  const [tactics, setTactics] = useState([]);
  const [mapImages, setMapImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let loadedMaps = DEFAULT_MAPS;
        let loadedTactics = [];
        let loadedImages = {};
        try {
          const m = await window.storage.get("cs2-tactics-maps", true);
          if (m?.value) loadedMaps = JSON.parse(m.value);
        } catch {}
        try {
          const t = await window.storage.get("cs2-tactics-data", true);
          if (t?.value) loadedTactics = JSON.parse(t.value);
        } catch {}
        try {
          const im = await window.storage.get("cs2-tactics-map-images", true);
          if (im?.value) loadedImages = JSON.parse(im.value);
        } catch {}
        if (!cancelled) {
          setMaps(loadedMaps);
          setTactics(loadedTactics);
          setMapImages(loadedImages);
        }
      } catch (e) {
        if (!cancelled) setError("Không thể tải dữ liệu. Thử tải lại trang.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const persistMaps = useCallback(async (next) => {
    setMaps(next);
    try { await window.storage.set("cs2-tactics-maps", JSON.stringify(next), true); } catch {}
  }, []);

  const persistTactics = useCallback(async (next) => {
    setTactics(next);
    try { await window.storage.set("cs2-tactics-data", JSON.stringify(next), true); } catch {}
  }, []);

  const persistMapImages = useCallback(async (next) => {
    setMapImages(next);
    try { await window.storage.set("cs2-tactics-map-images", JSON.stringify(next), true); } catch {}
  }, []);

  return { maps, tactics, mapImages, loading, error, persistMaps, persistTactics, persistMapImages };
}

/* ---------------------------------------------------------
   MAIN APP
--------------------------------------------------------- */
export default function TacticsBoard() {
  const { maps, tactics, mapImages, loading, error, persistMaps, persistTactics, persistMapImages } = useTacticsStore();
  const [selectedMap, setSelectedMap] = useState(null);
  const [sideFilter, setSideFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // tactic object or null
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [newMapName, setNewMapName] = useState("");
  const [addingMap, setAddingMap] = useState(false);
  const [editingMapImage, setEditingMapImage] = useState(false);
  const [mapImageDraft, setMapImageDraft] = useState("");
  const [mapImageError, setMapImageError] = useState("");
  const mapImageFileRef = useRef(null);
  const importFileRef = useRef(null);
  const [importPending, setImportPending] = useState(null); // parsed data waiting confirmation
  const [importError, setImportError] = useState("");
  const [tipCopied, setTipCopied] = useState(false);

  const RADAR_TIP_CMD = 'bind CAPSLOCK "incrementvar cl_radar_scale 0 1 0.5"';
  const handleCopyTip = () => {
    const done = () => { setTipCopied(true); setTimeout(() => setTipCopied(false), 1500); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(RADAR_TIP_CMD).then(done).catch(() => {});
    }
  };

  useEffect(() => {
    if (!selectedMap && maps.length) setSelectedMap(maps[0]);
  }, [maps, selectedMap]);

  useEffect(() => {
    setEditingMapImage(false);
    setMapImageDraft("");
    setMapImageError("");
  }, [selectedMap]);

  const handleSaveMapImage = async () => {
    const raw = mapImageDraft.trim();
    if (!raw) { setEditingMapImage(false); return; }
    const url = raw.startsWith("data:") ? await hostImage(raw) : raw;
    await persistMapImages({ ...mapImages, [selectedMap]: url });
    setEditingMapImage(false);
    setMapImageDraft("");
    setMapImageError("");
  };

  const handleRemoveMapImage = async () => {
    const next = { ...mapImages };
    delete next[selectedMap];
    await persistMapImages(next);
  };

  const handleMapImageFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMapImageError("Vui lòng chọn một file ảnh (jpg, png, webp...).");
      return;
    }
    if (file.size > 4.5 * 1024 * 1024) {
      setMapImageError("Ảnh quá lớn (tối đa khoảng 4MB). Hãy chọn ảnh nhẹ hơn hoặc dùng link ảnh.");
      return;
    }
    setMapImageError("");
    const reader = new FileReader();
    reader.onload = () => setMapImageDraft(reader.result);
    reader.onerror = () => setMapImageError("Không đọc được file ảnh, thử lại nhé.");
    reader.readAsDataURL(file);
  };

  const mapTactics = useMemo(() => {
    let list = tactics.filter((t) => t.map === selectedMap);
    if (sideFilter !== "ALL") list = list.filter((t) => t.side === sideFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) =>
        t.name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.assignments?.some((a) => a.role?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [tactics, selectedMap, sideFilter, query]);

  const countsByMap = useMemo(() => {
    const c = {};
    tactics.forEach((t) => { c[t.map] = (c[t.map] || 0) + 1; });
    return c;
  }, [tactics]);

  const handleSave = async (tactic) => {
    let next;
    if (tactic.id && tactics.some((t) => t.id === tactic.id)) {
      next = tactics.map((t) => (t.id === tactic.id ? tactic : t));
    } else {
      next = [...tactics, { ...tactic, id: uid() }];
    }
    await persistTactics(next);
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    await persistTactics(tactics.filter((t) => t.id !== id));
    setConfirmDelete(null);
  };

  // Kéo thả: thả chiến thuật "dragId" vào đúng vị trí của "targetId"
  // trong danh sách đang hiển thị (đã lọc theo map/side/tìm kiếm).
  const handleReorderTactic = async (dragId, targetId) => {
    if (!dragId || !targetId || dragId === targetId) return;
    const fromIdx = mapTactics.findIndex((t) => t.id === dragId);
    const toIdx = mapTactics.findIndex((t) => t.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...mapTactics];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    await persistTactics(applySubsetOrder(tactics, reordered));
  };

  // Tích chọn ghim nhiều dòng: các dòng được tích sẽ dồn lên đầu, theo
  // đúng thứ tự người dùng tích (tích trước lên trước, tích sau lên sau);
  // những dòng không tích giữ nguyên thứ tự tương đối với nhau ở phía sau.
  const handleApplyPinOrder = async (pinnedIds) => {
    const pinnedSet = new Set(pinnedIds);
    const pinned = pinnedIds.map((id) => mapTactics.find((t) => t.id === id)).filter(Boolean);
    const rest = mapTactics.filter((t) => !pinnedSet.has(t.id));
    const reordered = [...pinned, ...rest];
    await persistTactics(applySubsetOrder(tactics, reordered));
  };

  const handleAddMap = async () => {
    const name = newMapName.trim();
    if (!name || maps.includes(name)) { setAddingMap(false); setNewMapName(""); return; }
    const next = [...maps, name];
    await persistMaps(next);
    setSelectedMap(name);
    setNewMapName("");
    setAddingMap(false);
  };

  const handleExportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      maps,
      tactics,
      mapImages,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cs2-tactics-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const triggerImport = () => {
    setImportError("");
    importFileRef.current?.click();
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.tactics) || !Array.isArray(data.maps)) {
          setImportError("File không đúng định dạng dữ liệu CS2 Tactics Board.");
          return;
        }
        setImportPending(data);
      } catch (err) {
        setImportError("Không đọc được file JSON, kiểm tra lại file nhé.");
      }
    };
    reader.onerror = () => setImportError("Không đọc được file, thử lại nhé.");
    reader.readAsText(file);
  };

  const confirmImport = async (mode = "replace") => {
    if (!importPending) return;
    const incomingMaps = importPending.maps || [];
    const incomingTactics = importPending.tactics || [];
    const incomingMapImages = importPending.mapImages || {};

    if (mode === "merge") {
      // Add without wiping out what's already here: keep every existing
      // map/tactic/map-image as-is, and only bring in items from the file
      // whose id/name isn't already present. Importing several backup
      // files one after another this way keeps combining them instead of
      // each one erasing what the previous import added.
      const nextMaps = [...maps];
      incomingMaps.forEach((m) => { if (!nextMaps.includes(m)) nextMaps.push(m); });

      const existingIds = new Set(tactics.map((t) => t.id));
      const nextTactics = [...tactics];
      incomingTactics.forEach((t) => {
        if (!t.id || !existingIds.has(t.id)) {
          const id = t.id && !existingIds.has(t.id) ? t.id : uid();
          existingIds.add(id);
          nextTactics.push({ ...t, id });
        }
      });

      const nextMapImages = { ...incomingMapImages, ...mapImages };

      await persistMaps(nextMaps);
      await persistTactics(nextTactics);
      await persistMapImages(nextMapImages);
      setImportPending(null);
      if (!selectedMap && nextMaps[0]) setSelectedMap(nextMaps[0]);
    } else {
      await persistMaps(incomingMaps);
      await persistTactics(incomingTactics);
      await persistMapImages(incomingMapImages);
      setImportPending(null);
      setSelectedMap(incomingMaps[0] || null);
    }
  };

  if (loading) {
    return (
      <div className="tac-root" style={{ minHeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "#5B9BD5" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg);} }`}</style>
          <div className="tac-mono" style={{ fontSize: 13, color: "#8A93A3" }}>ĐANG TẢI DỮ LIỆU…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tac-root" style={{ minHeight: 600, display: "flex", borderRadius: 12, overflow: "hidden", border: "1px solid #2A3340" }}>
      <FontStyles />

      {error && (
        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", background: "#E2574C", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 13, zIndex: 50 }}>
          {error}
        </div>
      )}

      {/* SIDEBAR */}
      <div style={{ width: 230, flexShrink: 0, background: "#141A22", borderRight: "1px solid #2A3340", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 16px 10px" }}>
          <div className="tac-display" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, color: "#fff" }}>
            TACTIC<span style={{ color: "#5B9BD5" }}>BOARD</span>
          </div>
          <div className="tac-mono" style={{ fontSize: 10, color: "#5C6573", marginTop: 4, letterSpacing: "0.08em" }}>
            CS2 · CHIẾN THUẬT THEO MAP
          </div>
        </div>

        <div className="tac-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
          {maps.map((m) => {
            const active = m === selectedMap;
            return (
              <button
                key={m}
                onClick={() => setSelectedMap(m)}
                className="tac-mapbtn"
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", marginBottom: 4, borderRadius: 8, border: "none",
                  background: active ? "#1B232E" : "transparent",
                  borderLeft: active ? "3px solid #5B9BD5" : "3px solid transparent",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <Crosshair size={14} style={{ color: active ? "#5B9BD5" : "#5C6573", flexShrink: 0 }} />
                <span className="tac-display" style={{ fontSize: 14, color: active ? "#fff" : "#B6BCC6", flex: 1 }}>
                  {m}
                </span>
                {!!countsByMap[m] && (
                  <span className="tac-mono" style={{ fontSize: 10, color: "#5C6573" }}>{countsByMap[m]}</span>
                )}
              </button>
            );
          })}

          {addingMap ? (
            <div style={{ display: "flex", gap: 6, padding: "6px 4px" }}>
              <input
                autoFocus
                className="tac-input"
                value={newMapName}
                onChange={(e) => setNewMapName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddMap(); if (e.key === "Escape") { setAddingMap(false); setNewMapName(""); } }}
                placeholder="Tên map…"
                style={{ flex: 1, background: "#0E1117", border: "1px solid #2A3340", borderRadius: 6, color: "#E8EAED", fontSize: 13, padding: "6px 8px" }}
              />
              <button onClick={handleAddMap} className="tac-iconbtn" style={{ background: "#1B232E", border: "1px solid #2A3340", borderRadius: 6, padding: "0 8px", color: "#6FCF97", cursor: "pointer" }}>
                <Save size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingMap(true)}
              className="tac-iconbtn"
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", marginTop: 2, borderRadius: 8, border: "1px dashed #2A3340", background: "transparent", color: "#5C6573", cursor: "pointer", fontSize: 13 }}
            >
              <Plus size={14} /> Thêm map
            </button>
          )}

          {/* Mẹo pro */}
          <div
            style={{
              margin: "14px 2px 4px",
              padding: "12px 12px 11px",
              borderRadius: 10,
              border: "1px solid #2A3340",
              background: "linear-gradient(160deg, #1B232E 0%, #141A22 100%)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Zap size={13} style={{ color: "#E0A458" }} />
              <span
                className="tac-display"
                style={{ fontSize: 10.5, fontWeight: 700, color: "#E0A458", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                Mẹo pro
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#B6BCC6", lineHeight: 1.5, marginBottom: 9 }}>
              Zoom in/out radar nhanh — gán phím <span style={{ color: "#E8EAED", fontWeight: 600 }}>CapsLock</span>:
            </div>
            <div style={{ position: "relative" }}>
              <code
                className="tac-mono"
                style={{
                  display: "block", fontSize: 10.5, color: "#6FCF97", background: "#0E1117",
                  border: "1px solid #2A3340", borderRadius: 6, padding: "8px 28px 8px 9px",
                  lineHeight: 1.6, wordBreak: "break-all",
                }}
              >
                {RADAR_TIP_CMD}
              </code>
              <button
                onClick={handleCopyTip}
                title="Sao chép lệnh"
                className="tac-iconbtn"
                style={{
                  position: "absolute", top: 6, right: 6, background: "transparent", border: "none",
                  color: tipCopied ? "#6FCF97" : "#5C6573", cursor: "pointer", padding: 3, display: "flex",
                }}
              >
                {tipCopied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: "10px", borderTop: "1px solid #2A3340", display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={handleExportData}
            className="tac-iconbtn"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid #2A3340", background: "transparent", color: "#B6BCC6", cursor: "pointer", fontSize: 12.5 }}
          >
            <Download size={14} /> Xuất dữ liệu
          </button>
          <button
            onClick={triggerImport}
            className="tac-iconbtn"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid #2A3340", background: "transparent", color: "#B6BCC6", cursor: "pointer", fontSize: 12.5 }}
          >
            <Upload size={14} /> Nhập dữ liệu
          </button>
          <input ref={importFileRef} type="file" accept="application/json,.json" onChange={handleImportFile} style={{ display: "none" }} />
          {importError && <div style={{ fontSize: 11, color: "#E2574C" }}>{importError}</div>}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0E1117", minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid #2A3340" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div className="tac-mono" style={{ fontSize: 11, color: "#5C6573", letterSpacing: "0.1em", marginBottom: 2 }}>
                [ MAP ĐANG CHỌN ]
              </div>
              <div className="tac-display" style={{ fontSize: 30, fontWeight: 700, color: "#fff", textTransform: "uppercase" }}>
                {selectedMap || "—"}
              </div>
            </div>
            <button
              onClick={() => { setEditing(null); setFormOpen(true); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, background: "#5B9BD5", color: "#0E1117",
                border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 600, fontSize: 14,
                cursor: "pointer",
              }}
            >
              <Plus size={16} /> Thêm chiến thuật
            </button>
          </div>

          {/* Map callout image */}
          <div style={{ marginTop: 14 }}>
            {editingMapImage ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 460 }}>
                {mapImageDraft && (
                  <div className="tac-fade-in" style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #2A3340", background: "#000" }}>
                    <img src={mapImageDraft} alt="Xem trước" style={{ display: "block", maxHeight: 160, width: "100%", objectFit: "contain" }} />
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    autoFocus
                    className="tac-input"
                    value={mapImageDraft}
                    onChange={(e) => setMapImageDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveMapImage(); if (e.key === "Escape") setEditingMapImage(false); }}
                    placeholder="Dán link ảnh radar / callout của map…"
                    style={{ flex: 1, background: "#141A22", border: "1px solid #2A3340", borderRadius: 8, color: "#E8EAED", fontSize: 13, padding: "9px 12px" }}
                  />
                  <input
                    ref={mapImageFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMapImageFile}
                    style={{ display: "none" }}
                  />
                  <button
                    onClick={() => mapImageFileRef.current?.click()}
                    className="tac-iconbtn"
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "#1B232E", border: "1px solid #2A3340", borderRadius: 8, padding: "9px 12px", color: "#E8EAED", cursor: "pointer", fontSize: 13, flexShrink: 0, whiteSpace: "nowrap" }}
                  >
                    <ImageIcon size={14} /> Tải ảnh lên
                  </button>
                </div>
                {mapImageError && (
                  <div style={{ fontSize: 12, color: "#E2574C" }}>{mapImageError}</div>
                )}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => setEditingMapImage(false)} style={{ background: "transparent", border: "1px solid #2A3340", borderRadius: 8, padding: "9px 14px", color: "#8A93A3", cursor: "pointer", fontSize: 13 }}>
                    Hủy
                  </button>
                  <button onClick={handleSaveMapImage} style={{ display: "flex", alignItems: "center", gap: 6, background: "#5B9BD5", color: "#0E1117", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    <Save size={13} /> Lưu
                  </button>
                </div>
              </div>
            ) : mapImages[selectedMap] ? (
              <div
                className="tac-fade-in"
                style={{ position: "relative", display: "inline-block", borderRadius: 10, overflow: "hidden", border: "1px solid #2A3340", background: "#000" }}
              >
                <img
                  src={mapImages[selectedMap]}
                  alt={`Sơ đồ ${selectedMap}`}
                  onClick={() => setLightbox(mapImages[selectedMap])}
                  style={{ display: "block", maxHeight: 220, maxWidth: "100%", objectFit: "contain", cursor: "zoom-in" }}
                />
                <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
                  <button
                    onClick={() => { setMapImageDraft(mapImages[selectedMap]); setMapImageError(""); setEditingMapImage(true); }}
                    className="tac-iconbtn"
                    style={{ background: "rgba(14,17,23,0.85)", border: "1px solid #2A3340", borderRadius: 6, padding: 6, color: "#E8EAED", cursor: "pointer" }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={handleRemoveMapImage}
                    className="tac-iconbtn"
                    style={{ background: "rgba(14,17,23,0.85)", border: "1px solid #2A3340", borderRadius: 6, padding: 6, color: "#E2574C", cursor: "pointer" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setMapImageDraft(""); setMapImageError(""); setEditingMapImage(true); }}
                className="tac-iconbtn"
                style={{ display: "flex", alignItems: "center", gap: 8, border: "1px dashed #2A3340", background: "transparent", color: "#5C6573", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontSize: 13 }}
              >
                <ImageIcon size={15} /> Thêm ảnh sơ đồ / callout cho {selectedMap}
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#141A22", border: "1px solid #2A3340", borderRadius: 8, padding: "7px 12px", flex: "1 1 220px" }}>
              <Search size={14} style={{ color: "#5C6573" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên, mô tả, role…"
                className="tac-input"
                style={{ flex: 1, background: "transparent", border: "none", color: "#E8EAED", fontSize: 13 }}
              />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["ALL", "CT", "T"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSideFilter(s)}
                  className="tac-chip"
                  style={{
                    padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: `1px solid ${sideFilter === s ? (SIDE_META[s]?.color || "#5B9BD5") : "#2A3340"}`,
                    background: sideFilter === s ? `${(SIDE_META[s]?.color || "#5B9BD5")}22` : "transparent",
                    color: sideFilter === s ? (SIDE_META[s]?.color || "#5B9BD5") : "#8A93A3",
                  }}
                >
                  {s === "ALL" ? "Tất cả" : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="tac-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "auto", padding: "0 24px 32px" }}>
          {mapTactics.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", color: "#5C6573" }}>
              <MapPin size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
              <div className="tac-display" style={{ fontSize: 16, color: "#8A93A3" }}>Chưa có chiến thuật nào</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Bấm "Thêm chiến thuật" để bắt đầu xây dựng tactic cho {selectedMap}.</div>
            </div>
          ) : (
            <TacticsTable
              tactics={mapTactics}
              onEdit={(t) => { setEditing(t); setFormOpen(true); }}
              onDelete={(t) => setConfirmDelete(t)}
              onImage={(url) => setLightbox(url)}
              onReorder={handleReorderTactic}
              onApplyPinOrder={handleApplyPinOrder}
            />
          )}
        </div>
      </div>

      {formOpen && (
        <TacticForm
          initial={editing}
          map={selectedMap}
          onCancel={() => { setFormOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Xóa chiến thuật?"
          message={`"${confirmDelete.name || "Chiến thuật này"}" sẽ bị xóa vĩnh viễn.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete.id)}
        />
      )}

      {importPending && (
        <ConfirmDialog
          title="Nhập dữ liệu?"
          message={`File có ${importPending.tactics.length} chiến thuật. Chọn "Gộp / Thêm mới" để thêm vào dữ liệu hiện tại (${tactics.length} chiến thuật) mà không xóa gì cả — dùng cách này nếu bạn nhập nhiều file backup liên tiếp. Chọn "Thay thế toàn bộ" nếu muốn xóa hết dữ liệu hiện tại và dùng đúng dữ liệu trong file.`}
          onCancel={() => setImportPending(null)}
          extraLabel="Gộp / Thêm mới"
          onExtra={() => confirmImport("merge")}
          extraColor="#6FCF97"
          confirmLabel="Thay thế toàn bộ"
          confirmColor="#E2574C"
          onConfirm={() => confirmImport("replace")}
        />
      )}

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24, cursor: "zoom-out", gap: 12 }}
        >
          <img
            src={typeof lightbox === "string" ? lightbox : lightbox.src}
            alt=""
            style={{ maxWidth: "90%", maxHeight: "82vh", borderRadius: 8, border: "1px solid #2A3340" }}
          />
          {typeof lightbox !== "string" && lightbox.caption && (
            <div className="tac-root" style={{ color: "#E8EAED", fontSize: 14, background: "rgba(20,26,34,0.9)", padding: "8px 16px", borderRadius: 8, maxWidth: "80%", textAlign: "center" }}>
              {lightbox.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   TACTICS TABLE (layout ngang kiểu spreadsheet)
--------------------------------------------------------- */
function TacticsTable({ tactics, onEdit, onDelete, onImage, onReorder, onApplyPinOrder }) {
  const thStyle = {
    background: "#1E3FE0", color: "#fff", fontSize: 12.5, fontWeight: 700,
    textAlign: "left", padding: "10px 12px", position: "sticky", top: 0, zIndex: 2,
    whiteSpace: "nowrap", letterSpacing: "0.02em",
  };
  const cols = [
    { key: "order", label: "", width: 40 },
    { key: "stt", label: "STT", width: 50 },
    { key: "side", label: "CT/T", width: 64 },
    { key: "name", label: "Tatic", width: 160 },
    { key: "desc", label: "Mô tả", width: 280 },
    { key: "role", label: "Role", width: 160 },
    { key: "video", label: "Video hướng dẫn ném đồ", width: 280 },
    { key: "image", label: "Hình ảnh", width: 220 },
    { key: "actions", label: "", width: 70 },
  ];

  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [pinnedOrder, setPinnedOrder] = useState([]); // ids theo đúng thứ tự đã tích chọn

  const handleDragStart = (id) => (e) => {
    setDragId(id);
    try {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
    } catch {}
  };
  const handleDragOverRow = (id) => (e) => {
    e.preventDefault();
    if (dragId && id !== dragId && overId !== id) setOverId(id);
  };
  const handleDropRow = (id) => (e) => {
    e.preventDefault();
    if (dragId && dragId !== id) onReorder?.(dragId, id);
    setDragId(null);
    setOverId(null);
  };
  const handleDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };
  const handlePinToggle = (id, checked) => {
    setPinnedOrder((prev) => {
      const next = checked
        ? (prev.includes(id) ? prev : [...prev, id])
        : prev.filter((x) => x !== id);
      onApplyPinOrder?.(next);
      return next;
    });
  };

  return (
    <table className="tac-mono" style={{ borderCollapse: "collapse", width: "100%", minWidth: 1140, fontFamily: "'Inter', sans-serif" }}>
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c.key} style={{ ...thStyle, width: c.width, borderRight: "1px solid #3653F0" }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tactics.map((t, idx) => (
          <TacticRows
            key={t.id}
            index={idx + 1}
            tactic={t}
            onEdit={() => onEdit(t)}
            onDelete={() => onDelete(t)}
            onImage={onImage}
            isDragOver={overId === t.id}
            onDragStart={handleDragStart(t.id)}
            onDragOverRow={handleDragOverRow(t.id)}
            onDropRow={handleDropRow(t.id)}
            onDragEnd={handleDragEnd}
            isPinned={pinnedOrder.includes(t.id)}
            pinRank={pinnedOrder.length > 1 ? pinnedOrder.indexOf(t.id) + 1 : 0}
            onPinToggle={(checked) => handlePinToggle(t.id, checked)}
          />
        ))}
      </tbody>
    </table>
  );
}

function TacticRows({
  index, tactic, onEdit, onDelete, onImage,
  isDragOver, onDragStart, onDragOverRow, onDropRow, onDragEnd, isPinned, pinRank, onPinToggle,
}) {
  const meta = SIDE_META[tactic.side] || SIDE_META.CT;
  const Icon = meta.icon;
  const [openVideos, setOpenVideos] = useState({});
  const [hoverPreview, setHoverPreview] = useState(null); // {src, caption, x, y}
  const assignments = tactic.assignments?.length ? tactic.assignments : [{ id: "_empty", role: "", videoUrls: [], note: "" }];
  const rowSpan = assignments.length;
  const tdBase = { border: "1px solid #232B36", padding: "10px 12px", fontSize: 13, color: "#E8EAED", verticalAlign: "top" };
  const toggleVideo = (id) => setOpenVideos((prev) => ({ ...prev, [id]: !prev[id] }));

  const showPreview = (img) => (e) => {
    setHoverPreview({ src: img.src, caption: img.caption, x: e.clientX, y: e.clientY });
  };
  const movePreview = (e) => {
    setHoverPreview((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev));
  };
  const hidePreview = () => setHoverPreview(null);

  // Cho phép kéo thả bắt đầu từ bất kỳ đâu trong dòng, nhưng nếu người
  // dùng đang bấm vào một phần tử có thể tương tác (nút, link, checkbox,
  // ảnh thu nhỏ...) thì hủy việc kéo để không chặn mất cú click bình thường.
  const handleRowDragStart = (e) => {
    if (e.target.closest("button, input, a, .tac-thumb")) {
      e.preventDefault();
      return;
    }
    onDragStart(e);
  };

  return (
    <>
      {assignments.map((a, i) => {
        const videos = getVideoList(a);
        return (
          <tr
            key={a.id}
            className="tac-fade-in"
            draggable
            onDragStart={handleRowDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOverRow}
            onDrop={onDropRow}
            title="Kéo dòng này để đổi thứ tự"
            style={{
              background: i % 2 === 0 ? "#141A22" : "#10151C",
              boxShadow: isDragOver ? "inset 0 2px 0 0 #5B9BD5" : "none",
              cursor: "grab",
            }}
          >
            {i === 0 && (
              <td
                rowSpan={rowSpan}
                style={{ ...tdBase, textAlign: "center", background: isPinned ? "#1F3A2C" : "#161B22" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <input
                    type="checkbox"
                    checked={!!isPinned}
                    onChange={(e) => onPinToggle?.(e.target.checked)}
                    title="Tích để đưa dòng này lên đầu — tích nhiều dòng theo thứ tự mong muốn"
                    style={{ cursor: "pointer", width: 16, height: 16, accentColor: "#6FCF97" }}
                  />
                  {pinRank > 0 && (
                    <span
                      title={`Thứ tự ghim: ${pinRank}`}
                      style={{
                        fontSize: 10, fontWeight: 700, color: "#6FCF97", background: "#6FCF9722",
                        borderRadius: 4, padding: "1px 5px", lineHeight: 1.4,
                      }}
                    >
                      {pinRank}
                    </span>
                  )}
                </div>
              </td>
            )}
            {i === 0 && (
              <td rowSpan={rowSpan} style={{ ...tdBase, textAlign: "center", fontWeight: 700, color: "#fff", background: "#161B22" }}>
                {index}
              </td>
            )}
            {i === 0 && (
              <td rowSpan={rowSpan} style={{ ...tdBase, background: "#161B22" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${meta.color}22`, color: meta.color, padding: "3px 8px", borderRadius: 5, fontSize: 11.5, fontWeight: 700 }}>
                  <Icon size={12} /> {meta.label}
                </span>
              </td>
            )}
            {i === 0 && (
              <td rowSpan={rowSpan} style={{ ...tdBase, fontWeight: 600, background: "#161B22" }} className="tac-display">
                {tactic.name || "(Chưa đặt tên)"}
              </td>
            )}
            {i === 0 && (
              <td rowSpan={rowSpan} style={{ ...tdBase, color: "#B6BCC6", lineHeight: 1.6, whiteSpace: "pre-wrap", background: "#161B22" }}>
                {tactic.description || "—"}
                {tactic.descImages?.length > 0 && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                    {tactic.descImages.map(normalizeImage).map((img, k) => (
                      <div key={img.id || k} style={{ width: 84, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <button
                          onClick={() => onImage(img)}
                          onMouseEnter={showPreview(img)}
                          onMouseMove={movePreview}
                          onMouseLeave={hidePreview}
                          className="tac-thumb"
                          style={{ border: "1px solid #2A3340", borderRadius: 6, padding: 0, background: "none", cursor: "zoom-in", overflow: "hidden", width: 84, height: 52, flexShrink: 0 }}
                        >
                          <img src={img.src} alt={img.caption || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </button>
                        {img.caption && (
                          <span style={{ fontSize: 10.5, color: "#9BA3AF", textAlign: "center", lineHeight: 1.35, wordBreak: "break-word" }}>
                            {img.caption}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </td>
            )}

            <td style={tdBase}>{a.role || "—"}</td>

            <td style={tdBase}>
              {videos.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {videos.map((v, vi) => {
                    const yt = v.fileData ? null : parseYoutube(v.url);
                    const isOpen = openVideos[v.id];
                    return (
                      <div key={v.id} style={{ paddingTop: vi > 0 ? 6 : 0, borderTop: vi > 0 ? "1px solid #232B36" : "none" }}>
                        {v.desc && <div style={{ fontSize: 12.5, color: "#E8EAED", marginBottom: 3 }}>{v.desc}</div>}
                        <button
                          onClick={() => toggleVideo(v.id)}
                          className="tac-chip"
                          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#5B9BD5", background: "transparent", border: "none", padding: 0, textAlign: "left" }}
                        >
                          <Play size={12} /> {v.desc ? "Xem video" : (videos.length > 1 ? `Video ${vi + 1}` : "Xem video")}
                          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                        {isOpen && v.fileData && (
                          <div className="tac-fade-in" style={{ marginTop: 8, borderRadius: 6, overflow: "hidden", width: "100%", maxWidth: 260, background: "#000" }}>
                            <video src={v.fileData} controls style={{ width: "100%", display: "block" }} />
                          </div>
                        )}
                        {isOpen && !v.fileData && yt && (
                          <div className="tac-fade-in" style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                              onClick={() => window.open(v.url, "_blank")}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5,
                                color: "#0E1117", background: "#5B9BD5", border: "none", borderRadius: 6,
                                padding: "6px 10px", cursor: "pointer", fontWeight: 600,
                              }}
                            >
                              <Play size={12} /> Mở video (tại {formatTimestamp(yt.start)})
                            </button>
                          </div>
                        )}
                        {isOpen && !v.fileData && !yt && v.url && (
                          <a href={v.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#5B9BD5", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <Link2 size={11} /> Mở liên kết video
                          </a>
                        )}
                      </div>
                    );
                  })}
                  {a.note && <div style={{ fontSize: 12, color: "#8A93A3" }}>{a.note}</div>}
                </div>
              ) : a.note ? (
                <div style={{ fontSize: 12, color: "#8A93A3" }}>{a.note}</div>
              ) : (
                <span style={{ color: "#5C6573" }}>—</span>
              )}
            </td>

            <td style={tdBase}>
              {(() => {
                const imgs = getAssignmentImages(a, tactic, i === 0);
                return imgs.length > 0 ? (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {imgs.map((img, k) => (
                      <div key={img.id || k} style={{ width: 84, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <button
                          onClick={() => onImage(img)}
                          onMouseEnter={showPreview(img)}
                          onMouseMove={movePreview}
                          onMouseLeave={hidePreview}
                          className="tac-thumb"
                          style={{ border: "1px solid #2A3340", borderRadius: 6, padding: 0, background: "none", cursor: "zoom-in", overflow: "hidden", width: 84, height: 52, flexShrink: 0 }}
                        >
                          <img src={img.src} alt={img.caption || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </button>
                        {img.caption && (
                          <span style={{ fontSize: 10.5, color: "#9BA3AF", textAlign: "center", lineHeight: 1.35, wordBreak: "break-word" }}>
                            {img.caption}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: "#5C6573" }}>—</span>
                );
              })()}
            </td>

            {i === 0 && (
              <td rowSpan={rowSpan} style={{ ...tdBase, background: "#161B22" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={onEdit} className="tac-iconbtn" style={{ background: "transparent", border: "1px solid #2A3340", borderRadius: 6, padding: 6, color: "#8A93A3", cursor: "pointer" }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={onDelete} className="tac-iconbtn" style={{ background: "transparent", border: "1px solid #2A3340", borderRadius: 6, padding: 6, color: "#E2574C", cursor: "pointer" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            )}
          </tr>
        );
      })}

      {hoverPreview && (
        <ImageHoverPreview preview={hoverPreview} />
      )}
    </>
  );
}

function ImageHoverPreview({ preview }) {
  const size = 320;
  const margin = 16;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  let left = preview.x + margin;
  let top = preview.y - size / 2;
  if (left + size > vw - 8) left = preview.x - size - margin;
  if (left < 8) left = 8;
  if (top + size + 50 > vh - 8) top = vh - size - 58;
  if (top < 8) top = 8;

  return (
    <tr>
      <td colSpan={8} style={{ border: "none", padding: 0, height: 0 }}>
        <div
          className="tac-root tac-hover-pop"
          style={{
            position: "fixed", left, top, width: size, zIndex: 200, pointerEvents: "none",
            background: "#161B22", border: "1px solid #5B9BD5", borderRadius: 12, overflow: "hidden",
            boxShadow: "0 18px 48px rgba(0,0,0,0.6)",
          }}
        >
          <img src={preview.src} alt="" style={{ width: "100%", display: "block", maxHeight: 280, objectFit: "contain", background: "#000" }} />
          {preview.caption && (
            <div style={{ padding: "9px 12px", fontSize: 12.5, color: "#E8EAED", lineHeight: 1.45, borderTop: "1px solid #232B36" }}>{preview.caption}</div>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ---------------------------------------------------------
   FORM (ADD / EDIT)
--------------------------------------------------------- */
function TacticForm({ initial, map, onCancel, onSave }) {
  const [side, setSide] = useState(initial?.side || "CT");
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [descImages, setDescImages] = useState(() =>
    (initial?.descImages || []).map((img) =>
      typeof img === "string" ? { id: uid(), src: img, caption: "" } : { id: img.id || uid(), src: img.src, caption: img.caption || "" }
    )
  );
  const [newDescImage, setNewDescImage] = useState("");
  const [descImageError, setDescImageError] = useState("");
  const [descImagesLoading, setDescImagesLoading] = useState(false);
  const descImageFilesRef = useRef(null);
  const [assignments, setAssignments] = useState(() => {
    const src = initial?.assignments?.length ? initial.assignments : [{ id: uid(), role: "", videoUrls: [{ id: uid(), url: "", desc: "", fileData: "", fileName: "" }], note: "", images: [] }];
    const legacyImages = (initial?.images || []).map((img) =>
      typeof img === "string" ? { id: uid(), src: img, caption: "" } : { id: img.id || uid(), src: img.src, caption: img.caption || "" }
    );
    return src.map((a, idx) => {
      const ownImages = Array.isArray(a.images)
        ? a.images.map((img) => (typeof img === "string" ? { id: uid(), src: img, caption: "" } : { id: img.id || uid(), src: img.src, caption: img.caption || "" }))
        : [];
      return {
        id: a.id || uid(),
        role: a.role || "",
        note: a.note || "",
        videoUrls: Array.isArray(a.videoUrls) && a.videoUrls.length
          ? a.videoUrls.map((v) => ({ id: v.id || uid(), url: v.url || "", desc: v.desc || "", fileData: v.fileData || "", fileName: v.fileName || "" }))
          : a.videoUrl
          ? [{ id: uid(), url: a.videoUrl, desc: "", fileData: "", fileName: "" }]
          : [{ id: uid(), url: "", desc: "", fileData: "", fileName: "" }],
        images: ownImages.length ? ownImages : (idx === 0 ? legacyImages : []),
      };
    });
  });
  const [newImageDrafts, setNewImageDrafts] = useState({}); // { [assignmentId]: string }
  const [imageError, setImageError] = useState("");
  const [imagesLoadingFor, setImagesLoadingFor] = useState(null); // assignmentId
  const [videoError, setVideoError] = useState("");
  const [videoLoadingFor, setVideoLoadingFor] = useState(null); // videoId
  const nameRef = useRef(null);
  const imageFilesRef = useRef(null);
  const videoFilesRef = useRef(null);
  const uploadTargetRef = useRef(null); // assignmentId currently targeted by hidden image file input
  const uploadVideoTargetRef = useRef(null); // { assignmentId, videoId } targeted by hidden video file input

  useEffect(() => { nameRef.current?.focus(); }, []);

  const updateAssignment = (id, field, value) => {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };
  const addAssignment = () => setAssignments((prev) => [...prev, { id: uid(), role: "", videoUrls: [{ id: uid(), url: "", desc: "", fileData: "", fileName: "" }], note: "", images: [] }]);
  const removeAssignment = (id) => setAssignments((prev) => prev.filter((a) => a.id !== id));

  const updateVideoField = (assignmentId, videoId, field, value) => {
    setAssignments((prev) => prev.map((a) => (
      a.id === assignmentId
        ? { ...a, videoUrls: a.videoUrls.map((v) => (v.id === videoId ? { ...v, [field]: value } : v)) }
        : a
    )));
  };
  const addVideoUrl = (assignmentId) => {
    setAssignments((prev) => prev.map((a) => (
      a.id === assignmentId ? { ...a, videoUrls: [...a.videoUrls, { id: uid(), url: "", desc: "", fileData: "", fileName: "" }] } : a
    )));
  };
  const removeVideoUrl = (assignmentId, videoId) => {
    setAssignments((prev) => prev.map((a) => (
      a.id === assignmentId ? { ...a, videoUrls: a.videoUrls.filter((v) => v.id !== videoId) } : a
    )));
  };

  const triggerVideoUpload = (assignmentId, videoId) => {
    uploadVideoTargetRef.current = { assignmentId, videoId };
    videoFilesRef.current?.click();
  };
  const clearVideoFile = (assignmentId, videoId) => {
    setAssignments((prev) => prev.map((a) => (
      a.id === assignmentId
        ? { ...a, videoUrls: a.videoUrls.map((v) => (v.id === videoId ? { ...v, fileData: "", fileName: "" } : v)) }
        : a
    )));
  };
  const handleVideoFile = (e) => {
    const target = uploadVideoTargetRef.current;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !target) return;
    if (!file.type.startsWith("video/")) { setVideoError("Vui lòng chọn một file video."); return; }
    setVideoError("");
    setVideoLoadingFor(target.videoId);
    const reader = new FileReader();
    reader.onload = async () => {
      const hosted = await hostImage(reader.result);
      setAssignments((prev) => prev.map((a) => (
        a.id === target.assignmentId
          ? { ...a, videoUrls: a.videoUrls.map((v) => (v.id === target.videoId ? { ...v, fileData: hosted, fileName: file.name, url: "" } : v)) }
          : a
      )));
      setVideoLoadingFor(null);
    };
    reader.onerror = () => {
      setVideoError("Không đọc được file video, thử lại nhé.");
      setVideoLoadingFor(null);
    };
    reader.readAsDataURL(file);
  };

  const addAssignmentImage = (assignmentId) => {
    const v = (newImageDrafts[assignmentId] || "").trim();
    if (!v) return;
    setAssignments((prev) => prev.map((a) => (
      a.id === assignmentId ? { ...a, images: [...a.images, { id: uid(), src: v, caption: "" }] } : a
    )));
    setNewImageDrafts((prev) => ({ ...prev, [assignmentId]: "" }));
  };
  const removeAssignmentImage = (assignmentId, imageId) => {
    setAssignments((prev) => prev.map((a) => (
      a.id === assignmentId ? { ...a, images: a.images.filter((img) => img.id !== imageId) } : a
    )));
  };
  const updateAssignmentImageCaption = (assignmentId, imageId, caption) => {
    setAssignments((prev) => prev.map((a) => (
      a.id === assignmentId ? { ...a, images: a.images.map((img) => (img.id === imageId ? { ...img, caption } : img)) } : a
    )));
  };

  const triggerImageUpload = (assignmentId) => {
    uploadTargetRef.current = assignmentId;
    imageFilesRef.current?.click();
  };

  const handleImageFiles = (e) => {
    const assignmentId = uploadTargetRef.current;
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || !assignmentId) return;
    setImageError("");
    const valid = files.filter((f) => {
      if (!f.type.startsWith("image/")) { setImageError("Một số file không phải ảnh đã bị bỏ qua."); return false; }
      return true;
    });
    if (!valid.length) return;
    setImagesLoadingFor(assignmentId);
    Promise.all(valid.map((f) => compressImage(f))).then((results) => {
      setAssignments((prev) => prev.map((a) => (
        a.id === assignmentId ? { ...a, images: [...a.images, ...results.map((src) => ({ id: uid(), src, caption: "" }))] } : a
      )));
    }).catch(() => {
      setImageError("Không đọc được một số file ảnh, thử lại nhé.");
    }).finally(() => setImagesLoadingFor(null));
  };

  const addDescImage = () => {
    const v = newDescImage.trim();
    if (!v) return;
    setDescImages((prev) => [...prev, { id: uid(), src: v, caption: "" }]);
    setNewDescImage("");
  };
  const removeDescImage = (id) => setDescImages((prev) => prev.filter((img) => img.id !== id));
  const updateDescImageCaption = (id, caption) => setDescImages((prev) => prev.map((img) => (img.id === id ? { ...img, caption } : img)));
  const handleDescImageFiles = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const valid = files.filter((f) => {
      if (!f.type.startsWith("image/")) { setDescImageError("Một số file không phải ảnh đã bị bỏ qua."); return false; }
      return true;
    });
    if (!valid.length) return;
    setDescImageError("");
    setDescImagesLoading(true);
    Promise.all(valid.map((f) => compressImage(f))).then((results) => {
      setDescImages((prev) => [...prev, ...results.map((src) => ({ id: uid(), src, caption: "" }))]);
    }).catch(() => {
      setDescImageError("Không đọc được một số file ảnh, thử lại nhé.");
    }).finally(() => setDescImagesLoading(false));
  };

  const canSave = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSave) return;
    onSave({
      id: initial?.id,
      map,
      side,
      name: name.trim(),
      description: description.trim(),
      descImages,
      assignments: assignments
        .map((a) => ({ ...a, videoUrls: a.videoUrls.filter((v) => v.url.trim() || v.fileData) }))
        .filter((a) => a.role.trim() || a.videoUrls.length || a.note.trim() || a.images.length),
    });
  };

  const inputStyle = {
    width: "100%", background: "#0E1117", border: "1px solid #2A3340", borderRadius: 8,
    color: "#E8EAED", fontSize: 13.5, padding: "9px 11px",
  };
  const labelStyle = { fontSize: 11.5, color: "#8A93A3", marginBottom: 6, display: "block", letterSpacing: "0.04em", textTransform: "uppercase" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,7,10,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 90, padding: 20 }}>
      <div
        className="tac-root tac-fade-in tac-scroll"
        style={{ width: 620, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", background: "#161B22", border: "1px solid #2A3340", borderRadius: 14, padding: 24 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div className="tac-mono" style={{ fontSize: 11, color: "#5C6573", marginBottom: 2 }}>[ {map} ]</div>
            <div className="tac-display" style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>
              {initial ? "Sửa chiến thuật" : "Thêm chiến thuật mới"}
            </div>
          </div>
          <button onClick={onCancel} className="tac-iconbtn" style={{ background: "transparent", border: "none", color: "#8A93A3", cursor: "pointer", padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Side */}
        <div style={{ marginBottom: 16 }}>
          <span style={labelStyle}>Bên thực hiện</span>
          <div style={{ display: "flex", gap: 8 }}>
            {["CT", "T"].map((s) => {
              const m = SIDE_META[s];
              const active = side === s;
              return (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className="tac-chip"
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "9px 0", borderRadius: 8, fontWeight: 600, fontSize: 13.5,
                    border: `1px solid ${active ? m.color : "#2A3340"}`,
                    background: active ? `${m.color}22` : "transparent",
                    color: active ? m.color : "#8A93A3",
                  }}
                >
                  <m.icon size={14} /> {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <span style={labelStyle}>Tên chiến thuật (Tatic)</span>
          <input ref={nameRef} className="tac-input" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder='VD: "Chiếm water nhanh nhất"' />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 18 }}>
          <span style={labelStyle}>Mô tả</span>
          <textarea
            className="tac-textarea"
            style={{ ...inputStyle, minHeight: 90, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả chi tiết cách triển khai…"
          />

          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 11, color: "#5C6573", marginBottom: 6, display: "block" }}>Hình ảnh minh hoạ cho mô tả</span>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                className="tac-input"
                style={inputStyle}
                value={newDescImage}
                onChange={(e) => setNewDescImage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addDescImage(); }}
                placeholder="Dán link ảnh rồi nhấn Enter…"
              />
              <button onClick={addDescImage} className="tac-iconbtn" style={{ background: "#1B232E", border: "1px solid #2A3340", borderRadius: 8, padding: "0 12px", color: "#E8EAED", cursor: "pointer", flexShrink: 0 }}>
                <Link2 size={14} />
              </button>
              <input
                ref={descImageFilesRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleDescImageFiles}
                style={{ display: "none" }}
              />
              <button
                onClick={() => descImageFilesRef.current?.click()}
                className="tac-iconbtn"
                style={{ display: "flex", alignItems: "center", gap: 6, background: "#1B232E", border: "1px solid #2A3340", borderRadius: 8, padding: "0 12px", color: "#E8EAED", cursor: "pointer", fontSize: 12.5, flexShrink: 0, whiteSpace: "nowrap" }}
              >
                {descImagesLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <ImageIcon size={14} />}
                Tải ảnh lên
              </button>
            </div>
            {descImageError && <div style={{ fontSize: 12, color: "#E2574C", marginBottom: 8 }}>{descImageError}</div>}
            {descImages.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {descImages.map((img) => (
                  <div key={img.id} style={{ display: "flex", gap: 8, alignItems: "center", background: "#161B22", border: "1px solid #232B36", borderRadius: 7, padding: 7 }}>
                    <img src={img.src} alt="" style={{ width: 50, height: 34, objectFit: "cover", borderRadius: 5, border: "1px solid #2A3340", flexShrink: 0 }} />
                    <input
                      className="tac-input"
                      style={{ ...inputStyle, flex: 1, padding: "7px 10px" }}
                      value={img.caption}
                      onChange={(e) => updateDescImageCaption(img.id, e.target.value)}
                      placeholder="Mô tả ảnh (tuỳ chọn)"
                    />
                    <button onClick={() => removeDescImage(img.id)} style={{ background: "none", border: "none", color: "#5C6573", cursor: "pointer", flexShrink: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assignments */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ ...labelStyle, marginBottom: 0 }}>Role &amp; video hướng dẫn</span>
            <button onClick={addAssignment} className="tac-chip" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#5B9BD5", background: "transparent", border: "none" }}>
              <Plus size={13} /> Thêm role
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {assignments.map((a, i) => (
              <div key={a.id} style={{ background: "#0E1117", border: "1px solid #232B36", borderRadius: 9, padding: 12, position: "relative" }}>
                {assignments.length > 1 && (
                  <button onClick={() => removeAssignment(a.id)} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "#5C6573", cursor: "pointer" }}>
                    <X size={14} />
                  </button>
                )}
                <input
                  className="tac-input"
                  style={{ ...inputStyle, marginBottom: 8, fontWeight: 600 }}
                  value={a.role}
                  onChange={(e) => updateAssignment(a.id, "role", e.target.value)}
                  placeholder={`Role #${i + 1} (VD: Người đi site A)`}
                />

                <span style={{ fontSize: 11, color: "#5C6573", marginBottom: 6, display: "block" }}>Video đính kèm</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                  {a.videoUrls.map((v, vi) => (
                    <div key={v.id} style={{ display: "flex", gap: 6, alignItems: "flex-start", background: "#161B22", border: "1px solid #232B36", borderRadius: 7, padding: 8 }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                        <input
                          className="tac-input"
                          style={inputStyle}
                          value={v.desc}
                          onChange={(e) => updateVideoField(a.id, v.id, "desc", e.target.value)}
                          placeholder={`Mô tả video #${vi + 1} (vd: Ném lửa or smoke upper - 13p13s)`}
                        />
                        {v.fileData ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0E1117", border: "1px solid #2A3340", borderRadius: 8, padding: "9px 11px" }}>
                            <Play size={14} style={{ color: "#5B9BD5", flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: "#E8EAED", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {v.fileName || "Video đã tải lên"}
                            </span>
                            <button onClick={() => clearVideoFile(a.id, v.id)} style={{ background: "none", border: "none", color: "#5C6573", cursor: "pointer", flexShrink: 0 }}>
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 6 }}>
                            <input
                              className="tac-input"
                              style={inputStyle}
                              value={v.url}
                              onChange={(e) => updateVideoField(a.id, v.id, "url", e.target.value)}
                              placeholder="Dán link Youtube (vd: https://youtu.be/ID?t=793)"
                            />
                            <button
                              onClick={() => triggerVideoUpload(a.id, v.id)}
                              className="tac-iconbtn"
                              style={{ display: "flex", alignItems: "center", gap: 6, background: "#1B232E", border: "1px solid #2A3340", borderRadius: 8, padding: "0 12px", color: "#E8EAED", cursor: "pointer", fontSize: 12.5, flexShrink: 0, whiteSpace: "nowrap" }}
                            >
                              {videoLoadingFor === v.id ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={13} />}
                              Tải video lên
                            </button>
                          </div>
                        )}
                      </div>
                      {a.videoUrls.length > 1 && (
                        <button onClick={() => removeVideoUrl(a.id, v.id)} style={{ background: "none", border: "none", color: "#5C6573", cursor: "pointer", flexShrink: 0, paddingTop: 8 }}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {videoError && <div style={{ fontSize: 12, color: "#E2574C", marginBottom: 8 }}>{videoError}</div>}
                <button
                  onClick={() => addVideoUrl(a.id)}
                  className="tac-chip"
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#5B9BD5", background: "transparent", border: "none", padding: 0, marginBottom: 12 }}
                >
                  <Plus size={12} /> Thêm video khác
                </button>

                <input
                  className="tac-input"
                  style={{ ...inputStyle, marginBottom: 12 }}
                  value={a.note}
                  onChange={(e) => updateAssignment(a.id, "note", e.target.value)}
                  placeholder="Ghi chú thêm (tuỳ chọn)"
                />

                {/* Images for this role */}
                <div style={{ borderTop: "1px solid #232B36", paddingTop: 10 }}>
                  <span style={{ fontSize: 11, color: "#5C6573", marginBottom: 6, display: "block" }}>Hình ảnh cho role này</span>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      className="tac-input"
                      style={inputStyle}
                      value={newImageDrafts[a.id] || ""}
                      onChange={(e) => setNewImageDrafts((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") addAssignmentImage(a.id); }}
                      placeholder="Dán link ảnh rồi nhấn Enter…"
                    />
                    <button onClick={() => addAssignmentImage(a.id)} className="tac-iconbtn" style={{ background: "#1B232E", border: "1px solid #2A3340", borderRadius: 8, padding: "0 12px", color: "#E8EAED", cursor: "pointer", flexShrink: 0 }}>
                      <Link2 size={14} />
                    </button>
                    <button
                      onClick={() => triggerImageUpload(a.id)}
                      className="tac-iconbtn"
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "#1B232E", border: "1px solid #2A3340", borderRadius: 8, padding: "0 12px", color: "#E8EAED", cursor: "pointer", fontSize: 12.5, flexShrink: 0, whiteSpace: "nowrap" }}
                    >
                      {imagesLoadingFor === a.id ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <ImageIcon size={14} />}
                      Tải ảnh lên
                    </button>
                  </div>
                  {a.images.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {a.images.map((img) => (
                        <div key={img.id} style={{ display: "flex", gap: 8, alignItems: "center", background: "#161B22", border: "1px solid #232B36", borderRadius: 7, padding: 7 }}>
                          <img src={img.src} alt="" style={{ width: 50, height: 34, objectFit: "cover", borderRadius: 5, border: "1px solid #2A3340", flexShrink: 0 }} />
                          <input
                            className="tac-input"
                            style={{ ...inputStyle, flex: 1, padding: "7px 10px" }}
                            value={img.caption}
                            onChange={(e) => updateAssignmentImageCaption(a.id, img.id, e.target.value)}
                            placeholder="Mô tả ảnh (tuỳ chọn)"
                          />
                          <button onClick={() => removeAssignmentImage(a.id, img.id)} style={{ background: "none", border: "none", color: "#5C6573", cursor: "pointer", flexShrink: 0 }}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {imageError && <div style={{ fontSize: 12, color: "#E2574C", marginTop: 8 }}>{imageError}</div>}
          <input
            ref={imageFilesRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageFiles}
            style={{ display: "none" }}
          />
          <input
            ref={videoFilesRef}
            type="file"
            accept="video/*"
            onChange={handleVideoFile}
            style={{ display: "none" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onCancel} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #2A3340", background: "transparent", color: "#B6BCC6", cursor: "pointer", fontSize: 13.5 }}>
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSave}
            style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: canSave ? "#5B9BD5" : "#2A3340", color: canSave ? "#0E1117" : "#5C6573", cursor: canSave ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 13.5 }}
          >
            Lưu chiến thuật
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   CONFIRM DIALOG
--------------------------------------------------------- */
function ConfirmDialog({
  title, message, onCancel, onConfirm,
  confirmLabel = "Xóa", confirmColor = "#E2574C",
  extraLabel, onExtra, extraColor = "#5B9BD5",
}) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,7,10,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 95, padding: 20 }}>
      <div className="tac-root tac-fade-in" style={{ width: 400, background: "#161B22", border: "1px solid #2A3340", borderRadius: 14, padding: 22 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
          <AlertTriangle size={18} style={{ color: confirmColor, flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className="tac-display" style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 13, color: "#8A93A3", lineHeight: 1.5 }}>{message}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 10 }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #2A3340", background: "transparent", color: "#B6BCC6", cursor: "pointer", fontSize: 13 }}>
            Hủy
          </button>
          {extraLabel && onExtra && (
            <button onClick={onExtra} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: extraColor, color: "#0E1117", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              {extraLabel}
            </button>
          )}
          <button onClick={onConfirm} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: confirmColor, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
