/* The Notebook — Multi-File Markdown Editor
   - LocalStorage persistence
   - Theme toggle (light/dark) with system preference + persistence
   - Marked.js if available; simple fallback renderer otherwise
   - Debounced autosave + status
   - Import/Export JSON with selection modal
   - Links open in new tabs
   - No keyboard shortcuts (no interference while typing)
*/

(function () {
  const $ = (sel) => document.querySelector(sel);
  const listEl = $('#file-list');
  const editorEl = $('#editor');
  const previewEl = $('#preview');
  const searchEl = $('#search');
  const statusEl = $('#save-status');

  const btnNew = $('#btn-new');
  const btnRename = $('#btn-rename');
  const btnDelete = $('#btn-delete');
  const btnExport = $('#btn-export');
  const fileImport = $('#file-import');
  const btnTheme = $('#btn-theme');

  // Export modal elements
  const exportModal = document.getElementById('export-modal');
  const exportList = document.getElementById('export-list');
  const exportSelectAll = document.getElementById('export-select-all');
  const btnExportSelected = document.getElementById('btn-export-selected');
  const btnExportAllModal = document.getElementById('btn-export-all');
  const btnExportCancel = document.getElementById('btn-export-cancel');

  const STORAGE_KEY = 'notebook.v1.notes';
  const CURRENT_KEY = 'notebook.v1.currentId';
  const THEME_KEY = 'notebook.v1.theme'; // 'light' | 'dark'

  // --- Utilities -------------------------------------------------------------
  const uid = () => Math.random().toString(36).slice(2, 10);
  const nowISO = () => new Date().toISOString();
  const debounce = (fn, ms = 300) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };
  const lastSaved = (iso) => {
    try { return `Saved ${new Date(iso).toLocaleString()}`; } catch { return 'Saved'; }
  };

  // --- Theme handling --------------------------------------------------------
  function detectSystemTheme(){
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function applyTheme(theme){
    const t = (theme === 'light' || theme === 'dark') ? theme : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
    // Button label/icon
    if (btnTheme){
      if (t === 'light'){
        btnTheme.textContent = '☀️ Light';
        btnTheme.setAttribute('aria-pressed', 'true');
      } else {
        btnTheme.textContent = '🌙 Dark';
        btnTheme.setAttribute('aria-pressed', 'false');
      }
    }
  }
  function initTheme(){
    const saved = localStorage.getItem(THEME_KEY);
    applyTheme(saved || detectSystemTheme());
  }

  // --- Fallback Markdown (tiny) ---------------------------------------------
  function simpleEscape(html) {
    return html.replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function simpleMarkdown(md) {
    let out = simpleEscape(md);
    out = out.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.replace(/^\n|\n$/g,'')}</code></pre>`);
    out = out.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
             .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
             .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
             .replace(/^### (.*)$/gm, '<h3>$1</h3>')
             .replace(/^## (.*)$/gm, '<h2>$1</h2>')
             .replace(/^# (.*)$/gm, '<h1>$1</h1>');
    out = out.replace(/^(?:-{3,}|\*{3,}|_{3,})$/gm, '<hr>');
    out = out.replace(/^(> .*(\n>.*)*)/gm, (m) => `<blockquote>${m.replace(/^> ?/gm, '')}</blockquote>`);
    out = out.replace(/(^|\n)(- .*(\n  - .*)*)/g, (m) => {
      const html = m.trim().split('\n').map(line => `<li>${line.replace(/^(-|  -) /, '')}</li>`).join('');
      return `\n<ul>${html}</ul>`;
    });
    out = out.replace(/(^|\n)(\d+\. .*(\n {3}\d+\..*)*)/g, (m) => {
      const html = m.trim().split('\n').map(line => `<li>${line.replace(/^\d+\. /, '')}</li>`).join('');
      return `\n<ol>${html}</ol>`;
    });
    out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\*\*\*([^\*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
             .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
             .replace(/\*([^*]+)\*/g, '<em>$1</em>')
             .replace(/~~([^~]+)~~/g, '<del>$1</del>')
             .replace(/&lt;ins&gt;([\s\S]*?)&lt;\/ins&gt;/g, '<ins>$1</ins>');
    out = out.replace(/^(?!<h\d|<ul>|<ol>|<pre>|<blockquote>|<img|<hr|<\/ul>|<\/ol>|<\/pre>|<\/blockquote>)(.+)$/gm, '<p>$1</p>');
    out = out.replace(/  \n/g, '<br>\n');
    return out;
  }

  const hasMarked = () => typeof window.marked === 'function' || (window.marked && typeof window.marked.parse === 'function');

  function renderMarkdown(md) {
    if (hasMarked()) {
      if (window.marked.setOptions) {
        window.marked.setOptions({ gfm: true, breaks: true, headerIds: true, mangle: false });
      }
      if (window.marked.Renderer) {
        const renderer = new window.marked.Renderer();
        const origLink = renderer.link;
        renderer.link = function(href, title, text) {
          const html = origLink.call(this, href, title, text);
          return html.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ');
        };
        return window.marked.parse(md, { renderer });
      }
      const parse = window.marked.parse || window.marked;
      return parse(md);
    }
    return simpleMarkdown(md);
  }

  // --- Data layer ------------------------------------------------------------
  function loadNotes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }
  function saveNotes(notes) { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); }
  function getCurrentId() { return localStorage.getItem(CURRENT_KEY); }
  function setCurrentId(id) { localStorage.setItem(CURRENT_KEY, id || ''); }

  // --- Initial seed notes (Showcase) -----------------------------------------
  const SHOWCASE = `# 🧩 Markdown Showcase

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
Use the \`print()\` function in Python.

### Block
\`\`\`python
def greet(name):
    return f"Hello, {name}!"
print(greet("Markdown"))
\`\`\`

---

## 8. Tables

| Language | Type     | Popularity |
|---------:|:---------|:----------:|
|   Python | High     |    ⭐⭐⭐⭐    |
|    Rust  | Systems  |    ⭐⭐⭐     |
|  JavaScript | Web   |    ⭐⭐⭐⭐    |
`;

  function seedIfEmpty() {
    const existing = loadNotes();
    if (existing && Array.isArray(existing) && existing.length) return existing;

    const id1 = uid();
    const id2 = uid();
    const notes = [
      { id: id1, title: 'Welcome', content:
`# Welcome to The Notebook

- Create multiple **Markdown** notes
- Edit in the middle pane, _preview_ on the right
- Your notes are saved **locally** in the browser (no server)

Try the **Showcase** note next →`, updatedAt: nowISO() },
      { id: id2, title: '🧩 Markdown Showcase', content: SHOWCASE, updatedAt: nowISO() },
    ];
    saveNotes(notes);
    setCurrentId(id2);
    return notes;
  }

  // --- State ----------------------------------------------------------------
  let notes = seedIfEmpty();
  let currentId = getCurrentId() || (notes[0] && notes[0].id);

  function setStatus(text) { statusEl.textContent = text || ''; }

  function selectNote(id) {
    const note = notes.find(n => n.id === id) || notes[0];
    if (!note) return;
    currentId = note.id;
    setCurrentId(currentId);
    editorEl.value = note.content;
    updatePreview();
    renderList();
  }

  function renderList(filter = '') {
    const q = filter.trim().toLowerCase();
    listEl.innerHTML = '';
    notes
      .slice()
      .sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .forEach(note => {
        if (q && !`${note.title} ${note.content}`.toLowerCase().includes(q)) return;
        const li = document.createElement('li');
        li.className = 'file-item' + (note.id === currentId ? ' active' : '');
        li.setAttribute('role', 'option');
        li.dataset.id = note.id;

        const title = document.createElement('span');
        title.className = 'title';
        title.textContent = note.title || 'Untitled';

        const meta = document.createElement('span');
        meta.className = 'meta';
        meta.textContent = new Date(note.updatedAt).toLocaleDateString();

        li.appendChild(title);
        li.appendChild(meta);
        li.addEventListener('click', () => selectNote(note.id));
        listEl.appendChild(li);
      });
  }

  function updatePreview() {
    const md = editorEl.value || '';
    previewEl.innerHTML = renderMarkdown(md);
    // Ensure all links open in a new tab
    previewEl.querySelectorAll('a').forEach(a => {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });
  }

  const persist = debounce(() => {
    const idx = notes.findIndex(n => n.id === currentId);
    if (idx === -1) return;
    notes[idx].content = editorEl.value;
    notes[idx].updatedAt = nowISO();
    saveNotes(notes);
    setStatus(lastSaved(notes[idx].updatedAt));
    renderList(searchEl.value);
  }, 300);

  // --- Actions ---------------------------------------------------------------
  function newNote() {
    const title = prompt('New note title:', 'Untitled');
    if (title === null) return;
    const n = { id: uid(), title: title.trim() || 'Untitled', content: '', updatedAt: nowISO() };
    notes.push(n);
    saveNotes(notes);
    selectNote(n.id);
    setStatus('Created');
  }

  function renameNote() {
    const idx = notes.findIndex(n => n.id === currentId);
    if (idx === -1) return;
    const title = prompt('Rename note:', notes[idx].title);
    if (title === null) return;
    notes[idx].title = title.trim() || 'Untitled';
    notes[idx].updatedAt = nowISO();
    saveNotes(notes);
    renderList(searchEl.value);
    setStatus('Renamed');
  }

  function deleteNote() {
    if (!currentId) return;
    const note = notes.find(n => n.id === currentId);
    if (!note) return;
    if (!confirm(`Delete "${note.title}"? This cannot be undone.`)) return;
    notes = notes.filter(n => n.id !== currentId);
    saveNotes(notes);
    if (notes.length) {
      selectNote(notes[0].id);
    } else {
      const n = { id: uid(), title: 'Untitled', content: '', updatedAt: nowISO() };
      notes = [n]; saveNotes(notes); selectNote(n.id);
    }
    setStatus('Deleted');
  }

  // --- Import/Export (with selection modal) ---------------------------------
  function downloadJSON(filename, dataObj) {
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
  }

  function openExportModal() {
    exportList.innerHTML = '';
    const sorted = notes.slice().sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    sorted.forEach(n => {
      const row = document.createElement('label');
      row.className = 'export-item';
      row.innerHTML = `
        <input type="checkbox" class="export-check" value="${n.id}">
        <span class="title">${n.title || 'Untitled'}</span>
        <span class="meta">${new Date(n.updatedAt).toLocaleString()}</span>
      `;
      exportList.appendChild(row);
    });

    exportSelectAll.checked = false;
    exportModal.setAttribute('aria-hidden', 'false');

    exportModal.onclick = (e) => { if (e.target === exportModal) closeExportModal(); };
  }

  function closeExportModal() { exportModal.setAttribute('aria-hidden', 'true'); }

  function getSelectedNoteIds() {
    return Array.from(exportList.querySelectorAll('.export-check'))
      .filter(c => c.checked)
      .map(c => c.value);
  }

  function exportAllNotes() {
    downloadJSON('notebook-notes-all.json', notes);
    setStatus('Exported all');
  }

  function exportSelectedNotes() {
    const ids = getSelectedNoteIds();
    if (!ids.length) { alert('Please select at least one note (or use Export All).'); return; }
    const payload = notes.filter(n => ids.includes(n.id));
    downloadJSON(`notebook-notes-selected-${ids.length}.json`, payload);
    setStatus(`Exported ${ids.length} note(s)`);
  }

  function importNotes(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error('Invalid file format');
        const existingIds = new Set(notes.map(n => n.id));
        const toAdd = data.map(n => {
          if (!n || !n.title) return null;
          const id = (!existingIds.has(n.id) && n.id) ? n.id : uid();
          return { id, title: String(n.title), content: String(n.content || ''), updatedAt: n.updatedAt || nowISO() };
        }).filter(Boolean);
        notes = [...notes, ...toAdd];
        saveNotes(notes);
        renderList(searchEl.value);
        setStatus(`Imported ${toAdd.length} note(s)`);
      } catch (e) { alert('Import failed: ' + e.message); }
    };
    reader.readAsText(file);
  }

  // --- Events ----------------------------------------------------------------
  // Theme toggle
  btnTheme.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  editorEl.addEventListener('input', () => { updatePreview(); persist(); });
  btnNew.addEventListener('click', newNote);
  btnRename.addEventListener('click', renameNote);
  btnDelete.addEventListener('click', deleteNote);
  btnExport.addEventListener('click', openExportModal);

  fileImport.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) importNotes(f);
    fileImport.value = '';
  });

  searchEl.addEventListener('input', () => renderList(searchEl.value));

  // Export modal actions
  exportSelectAll.addEventListener('change', () => {
    const checks = exportList.querySelectorAll('.export-check');
    checks.forEach(c => { c.checked = exportSelectAll.checked; });
  });
  btnExportSelected.addEventListener('click', () => { exportSelectedNotes(); closeExportModal(); });
  btnExportAllModal.addEventListener('click', () => { exportAllNotes(); closeExportModal(); });
  btnExportCancel.addEventListener('click', () => { closeExportModal(); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && exportModal.getAttribute('aria-hidden') === 'false') {
      closeExportModal();
    }
  });

  // --- Boot ------------------------------------------------------------------
  initTheme();
  renderList();
  selectNote(localStorage.getItem(CURRENT_KEY) || (notes[0] && notes[0].id));
  setStatus('Ready');
})();
