import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * Controlled form for creating/updating a note.
 */
export default function NoteForm({ mode, initialNote, onCancel, onSubmit, isSaving }) {
  const isEdit = mode === "edit";
  const [title, setTitle] = useState(initialNote?.title ?? "");
  const [content, setContent] = useState(initialNote?.content ?? "");
  const [touched, setTouched] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    setTitle(initialNote?.title ?? "");
    setContent(initialNote?.content ?? "");
    setTouched(false);
  }, [initialNote?.id, mode]);

  useEffect(() => {
    // Focus title input whenever the form is shown.
    titleRef.current?.focus();
  }, [mode]);

  const titleError = useMemo(() => {
    if (!touched) return "";
    if (!title.trim()) return "Title is required.";
    return "";
  }, [title, touched]);

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      content,
    });
  }

  return (
    <section className="panel panel-form" aria-label={isEdit ? "Edit note" : "Add note"}>
      <div className="panel__header">
        <h2 className="h2">{isEdit ? "Edit note" : "Add a new note"}</h2>
        <div className="panel__headerActions">
          {isEdit ? (
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Close
            </button>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="field">
          <label htmlFor="note-title" className="label">
            Title <span aria-hidden="true" className="required">*</span>
          </label>
          <input
            id="note-title"
            ref={titleRef}
            className={`input ${titleError ? "input--error" : ""}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched(true)}
            disabled={isSaving}
            required
          />
          {titleError ? (
            <div className="field__error" role="alert">
              {titleError}
            </div>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="note-content" className="label">
            Content
          </label>
          <textarea
            id="note-content"
            className="textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSaving}
            rows={6}
          />
        </div>

        <div className="form__actions">
          {isEdit ? (
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>
              Cancel
            </button>
          ) : null}
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? "Saving…" : isEdit ? "Save changes" : "Add note"}
          </button>
        </div>
      </form>
    </section>
  );
}
