import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

function mockFetchOnce(response) {
  global.fetch = jest.fn().mockResolvedValue(response);
}

function mockFetchFail() {
  global.fetch = jest.fn().mockRejectedValue(new Error("Network down"));
}

function okJson(data) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(data),
  };
}

function okEmpty() {
  return {
    ok: true,
    status: 204,
    text: async () => "",
  };
}

beforeEach(() => {
  window.localStorage.clear();
  jest.restoreAllMocks();
});

test("renders empty state and CTA when there are no notes", async () => {
  mockFetchOnce(okJson([]));

  render(<App />);

  expect(await screen.findByText(/No notes yet/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /\+ New note/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Add your first note/i })).toBeInTheDocument();
});

test("creates a note (server mode)", async () => {
  // Initial load
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce(okJson([]))
    // Create note
    .mockResolvedValueOnce(okJson({ id: "1", title: "Hello", content: "World" }));

  render(<App />);

  await screen.findByText(/No notes yet/i);

  await userEvent.type(screen.getByLabelText(/Title/i), "Hello");
  await userEvent.type(screen.getByLabelText(/Content/i), "World");
  await userEvent.click(screen.getByRole("button", { name: /Add note/i }));

  // New note appears in list
  const list = await screen.findByRole("list", { name: /Notes/i });
  expect(within(list).getByText("Hello")).toBeInTheDocument();
  expect(screen.queryByText(/Offline mode/i)).not.toBeInTheDocument();
});

test("edits a note (server mode)", async () => {
  global.fetch = jest
    .fn()
    // Initial list
    .mockResolvedValueOnce(okJson([{ id: "1", title: "Old", content: "Body" }]))
    // Update
    .mockResolvedValueOnce(okJson({ id: "1", title: "New title", content: "Body" }));

  render(<App />);

  // Note appears
  const list = await screen.findByRole("list", { name: /Notes/i });
  await userEvent.click(within(list).getByRole("button", { name: /Edit note: Old/i }));

  const titleInput = screen.getByLabelText(/Title/i);
  await userEvent.clear(titleInput);
  await userEvent.type(titleInput, "New title");
  await userEvent.click(screen.getByRole("button", { name: /Save changes/i }));

  expect(await screen.findByText("New title")).toBeInTheDocument();
});

test("deletes a note (server mode)", async () => {
  global.fetch = jest
    .fn()
    // Initial list
    .mockResolvedValueOnce(okJson([{ id: "1", title: "To delete", content: "" }]))
    // Delete
    .mockResolvedValueOnce(okEmpty());

  jest.spyOn(window, "confirm").mockReturnValue(true);

  render(<App />);

  const list = await screen.findByRole("list", { name: /Notes/i });
  expect(within(list).getByText("To delete")).toBeInTheDocument();

  await userEvent.click(within(list).getByRole("button", { name: /Delete note: To delete/i }));

  // Returns to empty state
  expect(await screen.findByText(/No notes yet/i)).toBeInTheDocument();
});

test("uses local fallback when fetch fails and persists to localStorage", async () => {
  mockFetchFail();

  render(<App />);

  // Offline / fallback mode
  expect(await screen.findByText(/Offline mode/i)).toBeInTheDocument();

  // Create note offline
  await userEvent.type(screen.getByLabelText(/Title/i), "Offline note");
  await userEvent.type(screen.getByLabelText(/Content/i), "Saved locally");
  await userEvent.click(screen.getByRole("button", { name: /Add note/i }));

  const list = await screen.findByRole("list", { name: /Notes/i });
  expect(within(list).getByText("Offline note")).toBeInTheDocument();

  const stored = JSON.parse(window.localStorage.getItem("notes_fallback"));
  expect(Array.isArray(stored)).toBe(true);
  expect(stored[0].title).toBe("Offline note");
});
