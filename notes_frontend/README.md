# Simple Notes Frontend (React)

A lightweight notes UI that supports add/edit/delete and works even when the backend is unreachable by falling back to `localStorage`.

## Getting Started

From this folder:

```bash
npm install
npm start
```

Open http://localhost:3000.

## Backend Configuration (Environment Variables)

The app calls a REST API under:

- `GET /notes`
- `POST /notes`
- `PUT /notes/:id`
- `DELETE /notes/:id`

Configure the base URL using either of the following (preference order shown):

1. `REACT_APP_API_BASE` (preferred)
2. `REACT_APP_BACKEND_URL` (fallback)

Examples:

- Local backend:
  - `REACT_APP_API_BASE=http://localhost:8000`
- Deployed backend:
  - `REACT_APP_API_BASE=https://your-backend.example.com`

If the backend is unavailable, the app automatically switches to **Offline mode** and saves notes to `localStorage` under the key `notes_fallback`.

## Testing (CI-friendly)

```bash
CI=true npm test
```

Tests cover:
- Empty state and list rendering
- Creating, editing, and deleting notes
- Offline/local fallback behavior when `fetch` fails
"
