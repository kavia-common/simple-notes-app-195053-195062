/**
 * Local fallback storage for notes when backend is unreachable.
 */

const STORAGE_KEY = "notes_fallback";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function nowId() {
  // Simple, collision-resistant-enough id for local usage.
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * PUBLIC_INTERFACE
 * Load notes from localStorage fallback.
 * @returns {Array<{id:string,title:string,content:string}>}
 */
export function loadFallbackNotes() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeParse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((n) => n && typeof n.title === "string")
    .map((n) => ({
      id: n.id ?? nowId(),
      title: String(n.title ?? ""),
      content: String(n.content ?? ""),
    }));
}

/**
 * PUBLIC_INTERFACE
 * Persist notes to localStorage fallback.
 * @param {Array<{id:string,title:string,content:string}>} notes
 */
export function saveFallbackNotes(notes) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

/**
 * PUBLIC_INTERFACE
 * Create a new note locally and persist.
 * @param {{title:string,content:string}} note
 */
export function createFallbackNote(note) {
  const notes = loadFallbackNotes();
  const created = { id: nowId(), title: note.title, content: note.content ?? "" };
  const next = [created, ...notes];
  saveFallbackNotes(next);
  return created;
}

/**
 * PUBLIC_INTERFACE
 * Update an existing note locally and persist.
 * @param {string} id
 * @param {{title:string,content:string}} note
 */
export function updateFallbackNote(id, note) {
  const notes = loadFallbackNotes();
  const next = notes.map((n) =>
    String(n.id) === String(id) ? { ...n, title: note.title, content: note.content ?? "" } : n
  );
  saveFallbackNotes(next);
  return next.find((n) => String(n.id) === String(id)) || null;
}

/**
 * PUBLIC_INTERFACE
 * Delete an existing note locally and persist.
 * @param {string} id
 */
export function deleteFallbackNote(id) {
  const notes = loadFallbackNotes();
  const next = notes.filter((n) => String(n.id) !== String(id));
  saveFallbackNotes(next);
  return next;
}

/**
 * PUBLIC_INTERFACE
 * Replace local fallback with provided list.
 * @param {Array<{id:string,title:string,content:string}>} notes
 */
export function replaceFallbackNotes(notes) {
  saveFallbackNotes(notes);
  return loadFallbackNotes();
}
