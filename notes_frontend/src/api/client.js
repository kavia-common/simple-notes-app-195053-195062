/**
 * Notes API client.
 * Uses REACT_APP_API_BASE with fallback to REACT_APP_BACKEND_URL.
 */

const DEFAULT_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

/**
 * PUBLIC_INTERFACE
 * Returns the configured API base URL.
 * Prefers REACT_APP_API_BASE, falls back to REACT_APP_BACKEND_URL.
 */
export function getApiBaseUrl() {
  const base =
    (process.env.REACT_APP_API_BASE || "").trim() ||
    (process.env.REACT_APP_BACKEND_URL || "").trim();

  // Allow empty base URL for local fallback mode.
  return base.replace(/\/+$/, "");
}

function joinUrl(baseUrl, path) {
  if (!baseUrl) return path;
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${safePath}`;
}

async function safeReadJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toError(message, details) {
  const err = new Error(message);
  err.details = details;
  return err;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await safeReadJson(response);
    throw toError(`Request failed (${response.status})`, {
      status: response.status,
      body,
    });
  }

  // DELETE may return empty body.
  return safeReadJson(response);
}

/**
 * PUBLIC_INTERFACE
 * Fetch all notes from backend.
 */
export async function listNotes() {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw toError("No API base URL configured", { code: "NO_BASE_URL" });
  return requestJson(joinUrl(baseUrl, "/notes"), { method: "GET" });
}

/**
 * PUBLIC_INTERFACE
 * Create a note in backend.
 * @param {{title: string, content: string}} note
 */
export async function createNote(note) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw toError("No API base URL configured", { code: "NO_BASE_URL" });
  return requestJson(joinUrl(baseUrl, "/notes"), {
    method: "POST",
    body: JSON.stringify(note),
  });
}

/**
 * PUBLIC_INTERFACE
 * Update a note in backend.
 * @param {string|number} id
 * @param {{title: string, content: string}} note
 */
export async function updateNote(id, note) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw toError("No API base URL configured", { code: "NO_BASE_URL" });
  return requestJson(joinUrl(baseUrl, `/notes/${encodeURIComponent(String(id))}`), {
    method: "PUT",
    body: JSON.stringify(note),
  });
}

/**
 * PUBLIC_INTERFACE
 * Delete a note in backend.
 * @param {string|number} id
 */
export async function deleteNote(id) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw toError("No API base URL configured", { code: "NO_BASE_URL" });
  return requestJson(joinUrl(baseUrl, `/notes/${encodeURIComponent(String(id))}`), {
    method: "DELETE",
  });
}
