# Notebook — Multi-File Markdown Editor

A lightweight, local-first Markdown notes app with a three-panel layout (**File List • Editor • Live Preview**). All data stays in your browser.

---

## Project Choice

**The “Notebook” — Multi-File Markdown Editor**

---

## Justification of Tools

**AI (GPT-5):** Used throughout design and implementation for strong reasoning, structured planning, and clean refactoring. GPT-5 handled the “explain → propose → implement → validate” loop effectively, helping refine autosave behavior, link safety, fallback rendering, and UX microcopy.

**Stack (HTML/CSS/Vanilla JS):** Zero setup and portable—open `index.html` and it works. The three-panel UI is straightforward with semantic HTML + CSS Grid, while vanilla JS keeps logic small, auditable, and fast (no framework overhead).

**Persistence:** `localStorage` provides instant, private, local-first saving with no backend. It’s sufficient for a lightweight notes app; IndexedDB remains a future option if note volume grows.

**Developer Experience (VS Code):** Live Server (“Go Live”) enables instant reloads and quick iteration—ideal for a local, single-page tool.

**Why not heavier tools?** Frameworks/TypeScript/IndexedDB add complexity without clear benefits at this scope. They remain easy upgrades if we later add collaboration, plugins, or large datasets.

> Local-first by design: all notes remain in the user’s browser (no servers), improving privacy and reducing setup friction.

---

## High-Level Approach

**Strategy:** I used a **prompt chain** (not a single prompt). I began with a comprehensive planning prompt covering product requirements, layout, stack, file separation, exact features (New/Rename/Delete, Import/Export JSON, debounced autosave), `localStorage` persistence, and a Markdown renderer with a fallback. From there, I iterated with short, targeted prompts to refine specific behaviors until all acceptance criteria were met.

**Prompt Chain (phases):**
1. **Spec & Scaffold:** Generate a minimal three-file structure (`index.html`, `style.css`, `app.js`) with a three-panel layout and clear DOM hooks.  
2. **Core Features:** File CRUD (New/Rename/Delete), `localStorage` (versioned keys), debounced autosave.  
3. **Markdown Rendering:** CDN-based Markdown parser **with a built-in fallback** so preview never breaks if CDN is unavailable.  
4. **Import/Export:** JSON export (all or selected notes) and robust import (merge/replace).  
5. **UX/Polish:** Keyboard focus, empty states, safe external links (`target="_blank"`, `rel="noopener noreferrer"`), responsive layout, and basic accessibility.  
6. **Validation:** Use the **Markdown Showcase** to verify headings, emphasis, lists, links, images, blockquotes, and code blocks render correctly.

**Logic Structure (in code):**
- **Data Model:** `{ id, title, content, updatedAt }`.  
- **State:** `activeNoteId`, `notes`, `saveStatus` (e.g., “Saving…”, “Saved 14:32”).  
- **Persistence:** `loadNotes()` / `saveNotes()` wrap `localStorage` (single source of truth) with versioned keys (`notebook.v1.*`).  
- **Event Flow:** Sidebar selects note → editor updates; editor `input` → debounce → save → re-render sidebar + preview.  
- **Rendering:** Editor text → Markdown engine (or fallback) → sanitized HTML in preview (safe links).  
- **Import/Export:** Export serializes notes to JSON; Import parses/validates and merges (assign new IDs if needed).  
- **Resilience:** Try/catch around `localStorage` and JSON parsing; graceful Markdown fallback if CDN fails.  
- **Performance:** Debounced autosave, minimal reflows, no framework overhead.  
- **Testing Discipline:** After each change, run a quick regression on CRUD, autosave debounce, import/export, safe links, and the Showcase.

---

## Final Prompts

> These are the exact prompts I used. They are copy-pastable and reproduce the same behavior shown in the project.

### Prompt 1 — Planning & Scaffold
Build **“Notebook — Multi-File Markdown Editor”** using **HTML, CSS, and vanilla JS**.

**App info**
- **Product:** Browser-based note app with a **three-panel** layout (File List | Markdown Editor | Live Preview). Create, manage, and edit multiple Markdown files. **All data saved locally in the browser.**  
- **Objective:** Lightweight, local-first app for writing, managing, and previewing multiple Markdown files in a clean three-panel interface.  
- **Target user:** Writers, developers, or students who need a simple, persistent, in-browser Markdown workflow.

**Build constraints**
- **Files:** Separate into three files (`index.html`, `style.css`, `app.js`).  
- **UI:** Modern, simple, responsive.  
- **Code:** Simple, readable, logically structured. Must run with **zero errors** by opening `index.html`.

**Exact features**
- New / Rename / Delete notes  
- Import / Export (JSON)  
- **Debounced autosave**  
- **Use `localStorage`** (versioned key OK)  
- **Markdown via CDN** with a **built-in fallback** if CDN fails  
- **Three-panel layout:** Files • Editor • Live Preview

**Validation**  
Use the following **Markdown Showcase** to verify rendering and features:

# 🧩 Markdown Showcase
This document is designed to **test Markdown rendering** in your app or viewer.  
It includes all common syntax and formatting styles.

---

## 1. Headings

# H1 — Big Title
## H2 — Section Title
### H3 — Subsection
#### H4 — Smaller Header
##### H5 — Tiny Header
###### H6 — Smallest Header

---

## 2. Emphasis

**Bold text**  
*Italic text*  
***Bold and italic together***  
~~Strikethrough~~  
<ins>Underlined text (HTML)</ins>  

---

## 3. Lists

### Unordered
- Item A
  - Subitem A1
  - Subitem A2
- Item B
- Item C

### Ordered
1. First
2. Second
3. Third
   1. Nested 3.1
   2. Nested 3.2

---

## 4. Links

- [OpenAI](https://openai.com)
- [Local reference](#images)
- <https://example.com>

---

## 5. Images

![Markdown Logo](https://markdown-here.com/img/icon256.png)
*Figure 1. Example image with alt text.*

---

## 6. Blockquotes

> “Markdown is not a replacement for HTML,  
> but a shorthand syntax for writing HTML faster.”  
> — *John Gruber*

> Nested quote:
>> Second level

---

## 7. Code

### Inline
Use the `print()` function in Python.

### Block
```python
def greet(name):
    return f"Hello, {name}!"
print(greet("Markdown"))
```

### Prompt 2 — Safe Link Behavior
In the **Markdown preview**, make all links open in a **new tab** with:
- `target="_blank"`
- `rel="noopener noreferrer"`
Apply this to links produced by both the CDN renderer and the fallback renderer.

### Prompt 3 — Export Selection Flow
Add an **Export Selection** flow:
- Keep **Export All** for simplicity.
- Add a dialog to **select specific notes** (checkbox list). Export only the selected notes to JSON.
- Preserve existing IDs, titles, content, and timestamps in the JSON.

### Prompt 4 — Deliver Latest Complete Code
Return the **entire, current** source as three files—`index.html`, `style.css`, `app.js`—containing all implemented features (CRUD, debounced autosave, `localStorage`, Markdown renderer + fallback, safe links, Import/Export with selection). Provide the full file contents ready to copy.

### Prompt 5 — Light/Dark Theme Toggle
Add a **theme toggle**:
- Respect `prefers-color-scheme`.  
- Persist the user’s choice in `localStorage`.  
- Use CSS variables for colors and smooth transitions.  
- Provide a simple toggle button in the header; apply theme immediately on load and on toggle.

> **Notes**  
> • Prompts 2–5 were used iteratively to refine behavior after the initial scaffold from Prompt 1.  
> • The Markdown Showcase was pasted into a default note to validate headings, emphasis, lists, links, images, blockquotes, and code blocks.

---

## Instructions

**Prereqs:** Any modern browser (Chrome, Edge, Firefox, Safari). No build tools.

### Run Locally
1. Download the project folder. OR open the link https://abyss1234.github.io/The-Notebook---Multi-File-Markdown-Editor/
2. Open `index.html` directly in your browser **or** use VS Code → **Go Live** (Live Server) for auto-reload. 
3. (Optional) Start fresh: open DevTools (**F12**) → **Application / Storage** → clear this site’s data `localStorage`.

### Reproduce the Results
1. **CRUD (Create/Rename/Delete):**  
   - Create a note from the sidebar.  
   - Rename it and confirm the list stays sorted by most recently updated.  
   - Delete it; if notes remain, the most recent becomes active; if none remain, a new “Untitled” appears.  
2. **Debounced Autosave:**  
   - Type in the editor; you’ll see “Saving…” then “Saved HH:MM”.  
   - Refresh—content and the active note persist via `localStorage`.  
3. **Markdown Preview:**  
   - Paste the **Markdown Showcase** text (from this README) into the editor.  
   - Verify headings, emphasis, lists, links, images, blockquotes, and inline/fenced code render correctly.  
4. **Safe Links:**  
   - Click links in the **preview**; they open in a **new tab** with `rel="noopener noreferrer"`.  
5. **Import / Export (JSON):**  
   - **Export All** notes.  
   - Use **Export Selection** to export chosen notes only.  
   - **Import** the JSON and confirm notes merge correctly (titles/content/timestamps).  
6. **Theme Toggle:**  
   - Switch light/dark.  
   - Reload—your choice persists.  
7. **Local-First (Offline):**  
   - Disconnect from the internet and reload; the app still works.  
   - If the CDN Markdown parser can’t load, the **built-in fallback** still renders common Markdown.

### Troubleshooting
- **Preview not rendering fully?** The fallback handles common Markdown; ensure you’re testing in the preview, not the editor.  
- **Saves not sticking?** Check that browser storage is allowed and quota isn’t exceeded; clear old notes if needed.  
- **Links opening in same tab?** Make sure you’re clicking links in the **preview** panel.

---

## Challenges & Iterations

**Starting Point (Choosing the Stack)**  
I first asked which language fit the topic **without complexity** and chose **HTML/CSS/vanilla JS** for zero setup and a local-first model—ideal for a simple three-panel editor.

**v1 — Good UI, Markdown Logic Incomplete**  
The initial generation (from the pasted spec + stack) produced a clean three-panel UI, but **Markdown behavior was inconsistent**:
- Links didn’t always open correctly (some rendered as plain text; others opened in the same tab).  
- Text styles (bold/italic/strike/inline code) sometimes failed or conflicted when nested.  
- Fenced code blocks and blockquotes occasionally mis-rendered.  
Small patch prompts improved individual cases, but it felt like patching a fragile parsing pipeline.

**Pivot — Regenerate with a Precise Spec**  
I rewrote the prompt with **explicit requirements** to stabilize the preview pipeline:  
- Exact features: **New/Rename/Delete**, **Import/Export JSON**, **debounced autosave**  
- **`localStorage`** (versioned key)  
- **Markdown via CDN + a built-in fallback** (headings, emphasis, lists, links, images, blockquotes, fenced code)  
- Safe links (`target="_blank"`, `rel="noopener noreferrer"`)  
- Three files (HTML/CSS/JS), modern/simple UI, zero runtime errors  
This yielded a more coherent foundation for rendering and event handling.

**Focused Prompt Chain (Targeted Fixes)**  
- **Prompt 2:** Ensure all preview links open in a **new tab** with `rel="noopener noreferrer"` (CDN and fallback paths).  
- **Prompt 3:** Add **Export Selection** (keep Export All).  
- **Prompt 4:** Return the **entire, latest code** in one go after fixes (to prevent drift).  
- **Prompt 5:** Add **light/dark theme** with `prefers-color-scheme` and persistence.

**Validation Discipline**  
After each change, I ran a quick regression: CRUD, autosave debounce, import/export (all + selection), **safe links**, and the **Markdown Showcase** to verify headings, emphasis, lists, links, images, blockquotes, and **inline/fenced code**.

**Lessons Learned**  
- If the first generation shows systemic Markdown issues, **regenerate with a stricter, fully enumerated spec** rather than micro-patching.  
- Keep iteration prompts **atomic** (one concern per prompt), then request the **full code** to ensure the final state is consistent.  
- Maintain a **standard test doc** (the Showcase) to reproducibly verify Markdown features and link behavior.  
- Design prompts with a clear **goal**, **context**, **source**, and **explicit expectations** so the model reliably produces accurate, high-quality results.

**Outcome**  
After several iterations, the final prompt produced a stable, readable codebase: links behave correctly, text styles render reliably (including nested cases), fenced code blocks and blockquotes display as expected, and all required features work as specified with a simple, modern UI.
