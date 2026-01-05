import React from "react";

function truncate(text, max = 120) {
  if (!text) return "";
  const t = String(text);
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

/**
 * PUBLIC_INTERFACE
 * Displays a list of notes and emits edit/delete events.
 */
export default function NotesList({ notes, selectedId, onSelect, onDelete }) {
  return (
    <ul className="notes-list" aria-label="Notes">
      {notes.map((note) => {
        const isSelected = String(selectedId) === String(note.id);
        return (
          <li
            key={note.id}
            className={`note-card ${isSelected ? "note-card--selected" : ""}`}
          >
            <button
              type="button"
              className="note-card__main"
              onClick={() => onSelect(note)}
              aria-label={`Edit note: ${note.title}`}
            >
              <div className="note-card__title">{note.title}</div>
              <div className="note-card__content">{truncate(note.content)}</div>
            </button>

            <div className="note-card__actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onSelect(note)}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => onDelete(note)}
                aria-label={`Delete note: ${note.title}`}
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
