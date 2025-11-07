# Prompts — Notebook: Multi-File Markdown Editor

These are the exact prompts used to build and refine the project. They are copy‑pastable and should reproduce the same behavior shown in the repository.

---

## Model & Settings

- **Model:** GPT-5  
- **Interface:** Chat-based  
- **Temperature / Top‑p:** Defaults (not explicitly overridden)  
- **Notes:** Iterative prompt chain (plan → implement → refine → validate).

---

## Usage Notes

- Prompts were used **during development** (no runtime prompts in the app).  
- Prompts 2–5 refine specific behaviors on top of the scaffold produced by Prompt 1.  
- The **Markdown Showcase** was used as a standard test document after each iteration.

---

## Prompt 1 — Planning & Scaffold

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
Use the following **Markdown Showcase** to verify rendering and features (paste into a default note or the editor). See **Appendix A** below for the full text.

---

## Prompt 2 — Safe Link Behavior

In the **Markdown preview**, make all links open in a **new tab** with:
- `target="_blank"`  
- `rel="noopener noreferrer"`  

Apply this to links produced by both the CDN renderer and the fallback renderer.

---

## Prompt 3 — Export Selection Flow

Add an **Export Selection** flow:  
- Keep **Export All** for simplicity.  
- Add a dialog to **select specific notes** (checkbox list). Export only the selected notes to JSON.  
- Preserve existing IDs, titles, content, and timestamps in the JSON.

---

## Prompt 4 — Deliver Latest Complete Code

Return the **entire, current** source as three files—`index.html`, `style.css`, `app.js`—containing all implemented features (CRUD, debounced autosave, `localStorage`, Markdown renderer + fallback, safe links, Import/Export with selection). Provide the full file contents ready to copy.

---

## Prompt 5 — Light/Dark Theme Toggle

Add a **theme toggle**:  
- Respect `prefers-color-scheme`.  
- Persist the user’s choice in `localStorage`.  
- Use CSS variables for colors and smooth transitions.  
- Provide a simple toggle button in the header; apply theme immediately on load and on toggle.

---

## Appendix A — Markdown Showcase (Test Document)

```markdown
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
```

---

## Metadata (Optional)

- **Dates used:** (fill in)  
- **Repo tag/commit:** (fill in)  
- **Notes:** No runtime prompts; development-only.
