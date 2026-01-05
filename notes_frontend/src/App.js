import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import NotesList from "./components/NotesList";
import NoteForm from "./components/NoteForm";
import OfflineBanner from "./components/OfflineBanner";
import { createNote, deleteNote, listNotes, updateNote } from "./api/client";
import {
  createFallbackNote,
  deleteFallbackNote,
  loadFallbackNotes,
  replaceFallbackNotes,
  updateFallbackNote,
} from "./storage/localFallback";

function normalizeNotes(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((n) => n && (typeof n.title === "string" || typeof n.content === "string"))
    .map((n) => ({
      id: n.id,
      title: String(n.title ?? ""),
      content: String(n.content ?? ""),
    }));
}

function sortNotes(notes) {
  // Keep stable-ish order: newest first if ids are local_*, otherwise preserve incoming order.
  // For now, return as-is; creation prepends in UI.
  return notes;
}

/**
 * PUBLIC_INTERFACE
 * Notes application root.
 */
function App() {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null); // note or null
  const [mode, setMode] = useState("add"); // add | edit

  const [isOffline, setIsOffline] = useState(false);
  const [bannerMsg, setBannerMsg] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [saving, setSaving] = useState(false);
  const [inlineError, setInlineError] = useState("");

  const lastServerSyncRef = useRef(false);

  const selectedId = selected?.id ?? null;

  const empty = useMemo(() => !loading && notes.length === 0, [loading, notes.length]);

  async function tryLoadFromServer() {
    setLoading(true);
    setLoadError("");
    try {
      const data = await listNotes();
      const normalized = sortNotes(normalizeNotes(data));
      setNotes(normalized);
      replaceFallbackNotes(normalized);
      setIsOffline(false);
      setBannerMsg("");
      lastServerSyncRef.current = true;
    } catch (e) {
      const fallback = loadFallbackNotes();
      setNotes(sortNotes(fallback));
      setIsOffline(true);
      setBannerMsg("Backend unavailable.");
      setLoadError(
        fallback.length === 0
          ? "Could not reach backend. You can still use notes locally."
          : "Could not reach backend. Showing locally saved notes."
      );
      lastServerSyncRef.current = false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial load.
    tryLoadFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startAdd() {
    setSelected(null);
    setMode("add");
    setInlineError("");
  }

  function startEdit(note) {
    setSelected(note);
    setMode("edit");
    setInlineError("");
  }

  async function handleCreate(payload) {
    setSaving(true);
    setInlineError("");

    // Optimistic create with temporary id.
    const tempId = `temp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const optimistic = { id: tempId, title: payload.title, content: payload.content ?? "" };
    setNotes((prev) => [optimistic, ...prev]);

    try {
      const created = await createNote(payload);
      if (!created || created.id == null) throw new Error("Invalid create response");
      setNotes((prev) => [created, ...prev.filter((n) => String(n.id) !== String(tempId))]);
      replaceFallbackNotes([created, ...notes.filter((n) => String(n.id) !== String(tempId))]);
      setIsOffline(false);
      setBannerMsg("");
      lastServerSyncRef.current = true;
    } catch (e) {
      // Revert optimistic item
      setNotes((prev) => prev.filter((n) => String(n.id) !== String(tempId)));
      // Fallback create locally
      const localCreated = createFallbackNote(payload);
      setNotes((prev) => [localCreated, ...prev]);
      setIsOffline(true);
      setBannerMsg("Saved locally.");
      setInlineError("Saved locally because backend could not be reached.");
      lastServerSyncRef.current = false;
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(payload) {
    if (!selected) return;
    setSaving(true);
    setInlineError("");

    const prevNote = selected;
    const optimistic = { ...prevNote, title: payload.title, content: payload.content ?? "" };

    setNotes((prev) =>
      prev.map((n) => (String(n.id) === String(prevNote.id) ? optimistic : n))
    );
    setSelected(optimistic);

    try {
      const updated = await updateNote(prevNote.id, payload);
      if (!updated) throw new Error("Invalid update response");
      setNotes((prev) =>
        prev.map((n) => (String(n.id) === String(prevNote.id) ? updated : n))
      );
      replaceFallbackNotes(
        notes.map((n) => (String(n.id) === String(prevNote.id) ? updated : n))
      );
      setSelected(updated);
      setIsOffline(false);
      setBannerMsg("");
      lastServerSyncRef.current = true;
    } catch (e) {
      // Revert optimistic update
      setNotes((prev) =>
        prev.map((n) => (String(n.id) === String(prevNote.id) ? prevNote : n))
      );
      // Fallback update locally
      const localUpdated = updateFallbackNote(String(prevNote.id), payload);
      if (localUpdated) {
        setNotes((prev) =>
          prev.map((n) => (String(n.id) === String(prevNote.id) ? localUpdated : n))
        );
        setSelected(localUpdated);
        setIsOffline(true);
        setBannerMsg("Saved locally.");
        setInlineError("Updated locally because backend could not be reached.");
      } else {
        setSelected(prevNote);
        setInlineError("Could not update note.");
      }
      lastServerSyncRef.current = false;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(note) {
    const ok = window.confirm(`Delete "${note.title}"? This cannot be undone.`);
    if (!ok) return;

    setInlineError("");
    const prior = notes;
    setNotes((prev) => prev.filter((n) => String(n.id) !== String(note.id)));
    if (selected && String(selected.id) === String(note.id)) {
      startAdd();
    }

    try {
      await deleteNote(note.id);
      replaceFallbackNotes(prior.filter((n) => String(n.id) !== String(note.id)));
      setIsOffline(false);
      setBannerMsg("");
      lastServerSyncRef.current = true;
    } catch (e) {
      // Revert if server delete failed, but still allow fallback delete locally.
      // Prefer fallback delete to keep user intent.
      deleteFallbackNote(String(note.id));
      setIsOffline(true);
      setBannerMsg("Saved locally.");
      setInlineError("Deleted locally because backend could not be reached.");
      lastServerSyncRef.current = false;
    }
  }

  return (
    <div className="App">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand">
            <div className="brand__mark" aria-hidden="true" />
            <div>
              <div className="brand__title">Notes</div>
              <div className="brand__subtitle">Simple, fast, and offline-friendly</div>
            </div>
          </div>

          <div className="topbar__actions">
            <button type="button" className="btn btn-primary" onClick={startAdd}>
              + New note
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={tryLoadFromServer}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <OfflineBanner isOffline={isOffline} message={bannerMsg} />

        {loadError ? (
          <div className="notice notice-warn" role="status" aria-live="polite">
            {loadError}
          </div>
        ) : null}

        {inlineError ? (
          <div className="notice notice-error" role="alert">
            {inlineError}
          </div>
        ) : null}

        <div className="layout">
          <section className="panel panel-list" aria-label="Notes list">
            <div className="panel__header">
              <h2 className="h2">Your notes</h2>
              <div className="meta">
                {isOffline ? "Local" : lastServerSyncRef.current ? "Synced" : "Not synced"}
              </div>
            </div>

            {loading ? (
              <div className="skeleton" role="status" aria-live="polite">
                Loading notes…
              </div>
            ) : empty ? (
              <div className="empty">
                <h3 className="h3">No notes yet</h3>
                <p className="muted">
                  Create your first note to keep track of ideas, tasks, or anything else.
                </p>
                <button type="button" className="btn btn-success" onClick={startAdd}>
                  Add your first note
                </button>
              </div>
            ) : (
              <NotesList
                notes={notes}
                selectedId={selectedId}
                onSelect={startEdit}
                onDelete={handleDelete}
              />
            )}
          </section>

          <NoteForm
            mode={mode}
            initialNote={selected}
            onCancel={startAdd}
            onSubmit={mode === "edit" ? handleUpdate : handleCreate}
            isSaving={saving}
          />
        </div>
      </main>

      <footer className="footer">
        <span className="muted">
          Configure backend via <code>REACT_APP_API_BASE</code> or{" "}
          <code>REACT_APP_BACKEND_URL</code>.
        </span>
      </footer>
    </div>
  );
}

export default App;
