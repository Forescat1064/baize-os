const PAGE_CONFIG = {
  profile: { label: "PROFILE", icon: "○", title: "PROFILE", kicker: "IDENTITY / 01", subtitle: "Define yourself.\nSet preferences.\nStay coherent." },
  goals: { label: "LONG-TERM GOALS", icon: "✥", title: "LONG-TERM GOALS", kicker: "DIRECTION / 02", subtitle: "Think in years.\nChoose deliberately.\nKeep the signal." },
  plan: { label: "CURRENT PLAN", icon: "☷", title: "CURRENT PLAN", kicker: "EXECUTION / 03", subtitle: "Focus today.\nExecute consistently.\nBuild momentum." },
  daily: { label: "DAILY LOG", icon: "▣", title: "DAILY LOG", kicker: "PRESENCE / 04", subtitle: "Record the day.\nNotice patterns.\nRemember clearly." },
  projects: { label: "PROJECTS", icon: "□", title: "PROJECTS", kicker: "DELIVERY / 05", subtitle: "Move the work.\nTrack decisions.\nFinish well." },
  ideas: { label: "IDEAS", icon: "♧", title: "IDEAS", kicker: "DISCOVERY / 06", subtitle: "Capture sparks.\nMake connections.\nLet them grow." },
  prompts: { label: "PROMPT LIBRARY", icon: "▤", title: "PROMPT LIBRARY", kicker: "INTELLIGENCE / 07", subtitle: "Shape context.\nReuse leverage.\nThink with AI." }
};

const STORAGE_KEY = "baize-os-v1";
const seedNotes = [
  { id: "n1", page: "plan", title: "v1.2 Release Roadmap", content: "## Goals\n\n- Deliver a stable and polished v1.2 experience.\n- Improve content discovery and summarization.\n- Publish launch post and update documentation.\n\nWe are targeting a release next week. Focus this week on testing, content polish, and performance.", tags: ["product", "release", "roadmap"], updated: "2026-06-12T09:41:00.000Z", selected: true },
  { id: "n2", page: "plan", title: "Content Engine Improvements", content: "Ideas and tasks to improve search, summaries, and tagging logic. The next pass should make retrieval feel immediate and trustworthy.", tags: ["engine", "content", "improvement"], updated: "2026-06-12T08:12:00.000Z", selected: true },
  { id: "n3", page: "plan", title: "User Interview Notes", content: "Key insights from power users about pain points and desired features. People want less ceremony and better recall.", tags: ["research", "users", "feedback"], updated: "2026-06-11T18:32:00.000Z", selected: true },
  { id: "n4", page: "plan", title: "Monetization Ideas", content: "Initial thoughts on pricing, plans, and positioning. Keep the local-first core generous and legible.", tags: ["growth", "monetization", "ideas"], updated: "2026-06-11T14:15:00.000Z", selected: false },
  { id: "n5", page: "plan", title: "Partnership Opportunities", content: "List of potential partners and outreach strategy.", tags: ["partnership", "outreach"], updated: "2026-06-10T11:04:00.000Z", selected: false },
  { id: "n6", page: "goals", title: "Build a durable creative practice", content: "Create useful work every week, protect deep work time, and review direction every quarter.", tags: ["creative", "practice"], updated: "2026-06-09T10:00:00.000Z", selected: false },
  { id: "n7", page: "daily", title: "Friday, June 12", content: "Good momentum today. The search model became clearer after simplifying the note schema.", tags: ["daily", "reflection"], updated: "2026-06-12T17:10:00.000Z", selected: false },
  { id: "n8", page: "projects", title: "Baize OS Prototype", content: "A local-first memory and execution workspace with expressive editorial design.", tags: ["active", "design"], updated: "2026-06-12T16:20:00.000Z", selected: false },
  { id: "n9", page: "ideas", title: "Context capsules", content: "Small reusable context bundles for different assistant roles and recurring workflows.", tags: ["ai", "context"], updated: "2026-06-10T13:40:00.000Z", selected: false },
  { id: "n10", page: "prompts", title: "Weekly review partner", content: "Act as a rigorous weekly review partner. Identify drift, unfinished loops, and the single most useful next move.", tags: ["review", "planning"], updated: "2026-06-08T09:30:00.000Z", selected: false },
  { id: "n11", page: "profile", title: "Working preferences", content: "I prefer concise plans, direct feedback, calm interfaces, and uninterrupted deep-work blocks.", tags: ["preferences", "context"], updated: "2026-06-07T12:00:00.000Z", selected: false }
];

const initialState = {
  currentPage: "plan",
  currentNoteId: "n1",
  darkMode: false,
  notes: seedNotes,
  priorities: [
    { title: "Ship the v1.2 release", detail: "Polish core features and publish launch update.", done: true },
    { title: "Deep work block", detail: "2-hour focus on content engine improvements.", done: true },
    { title: "Outreach & feedback", detail: "Contact 5 users and gather product feedback.", done: false }
  ]
};

let state = loadState();
let searchTerm = "";
let activeTag = "";

const $ = (selector) => document.querySelector(selector);
const navigation = $("#navigation");
const notesList = $("#notesList");

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...initialState, ...JSON.parse(saved) } : structuredClone(initialState);
  } catch {
    return structuredClone(initialState);
  }
}

function persist(message) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (message) toast(message);
}

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function renderNavigation() {
  navigation.innerHTML = Object.entries(PAGE_CONFIG).map(([key, page]) => `
    <button class="nav-button ${state.currentPage === key ? "active" : ""}" data-page="${key}">
      <span class="nav-icon">${page.icon}</span><span>${page.label}</span>
    </button>`).join("");
}

function renderPage() {
  const page = PAGE_CONFIG[state.currentPage];
  $("#pageTitle").textContent = page.title;
  $("#pageKicker").textContent = page.kicker;
  $("#pageSubtitle").innerHTML = page.subtitle.replaceAll("\n", "<br>");
  $("#listTitle").textContent = state.currentPage === "plan" ? "PLAN NOTES" : `${page.label} NOTES`;
  $("#prioritySection").hidden = state.currentPage !== "plan";
  renderNavigation();
  renderTags();
  renderNotes();
  renderSelected();
  loadEditor(state.currentNoteId);
  document.body.classList.toggle("dark", Boolean(state.darkMode));
  $("#themeToggle").textContent = state.darkMode ? "LIGHT ◑" : "DARK ◐";
}

function filteredNotes() {
  const query = searchTerm.toLowerCase();
  return state.notes
    .filter(note => searchTerm ? [note.title, note.content, note.page, ...note.tags].join(" ").toLowerCase().includes(query) : note.page === state.currentPage)
    .filter(note => !activeTag || note.tags.includes(activeTag))
    .sort((a, b) => new Date(b.updated) - new Date(a.updated));
}

function renderNotes() {
  const notes = filteredNotes();
  $("#noteCount").textContent = notes.length;
  notesList.innerHTML = notes.length ? notes.map(note => `
    <article class="note-row" data-note="${note.id}">
      <label class="select-note" title="Add to AI context"><input type="checkbox" data-select="${note.id}" ${note.selected ? "checked" : ""}></label>
      <div class="note-main" data-edit="${note.id}">
        <strong>${escapeHtml(note.title)}</strong>
        <p>${escapeHtml(note.content.replace(/[#*-]/g, "").slice(0, 88))}${note.content.length > 88 ? "..." : ""}</p>
      </div>
      <div class="tags">${note.tags.map(tag => `<button class="tag" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("")}</div>
      <div class="updated">${formatDate(note.updated)}</div>
      <div class="row-actions"><button data-edit="${note.id}" title="Edit note">↗</button><button data-remove="${note.id}" title="Delete note">⌫</button></div>
    </article>`).join("") : `<div class="search-empty">NO NOTES FOUND.<br>TRY ANOTHER SIGNAL.</div>`;
}

function renderPriorities() {
  $("#priorities").innerHTML = state.priorities.map((priority, index) => `
    <label class="priority">
      <span class="priority-number">0${index + 1}</span>
      <span><strong>${escapeHtml(priority.title)}</strong><small>${escapeHtml(priority.detail)}</small></span>
      <input type="checkbox" data-priority="${index}" ${priority.done ? "checked" : ""}>
    </label>`).join("");
}

function renderTags() {
  const tags = [...new Set(state.notes.flatMap(note => note.tags))].sort();
  $("#tagFilter").innerHTML = `<option value="">Filter by tag</option>${tags.map(tag => `<option ${activeTag === tag ? "selected" : ""} value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join("")}`;
}

function renderSelected() {
  const selected = state.notes.filter(note => note.selected);
  $("#selectedCount").textContent = selected.length;
  $("#selectedList").innerHTML = selected.length ? selected.map(note => `
    <div class="selected-item">
      <span>▣</span><div><strong>${escapeHtml(note.title)}</strong><br><span class="tag">${escapeHtml(note.tags[0] || "note")}</span></div>
    </div>`).join("") : `<div class="selected-empty">Select notes from any page<br>to build AI context.</div>`;
}

function loadEditor(id) {
  let note = state.notes.find(item => item.id === id);
  if (!note) note = state.notes.find(item => item.page === state.currentPage) || state.notes[0];
  if (!note) return;
  state.currentNoteId = note.id;
  $("#noteTitle").value = note.title;
  $("#noteTags").value = note.tags.join(", ");
  $("#noteContent").value = note.content;
  $("#editingTitle").textContent = note.title;
  $("#lastEdited").textContent = `Last edited: ${formatDate(note.updated)}`;
  updateWordCount();
}

function createNote() {
  const id = `n${Date.now()}`;
  const note = { id, page: state.currentPage, title: "Untitled note", content: "", tags: [], updated: new Date().toISOString(), selected: false };
  state.notes.unshift(note);
  state.currentNoteId = id;
  persist("NEW NOTE CREATED");
  renderPage();
  $("#noteTitle").focus();
}

function saveCurrentNote() {
  const note = state.notes.find(item => item.id === state.currentNoteId);
  if (!note) return;
  note.title = $("#noteTitle").value.trim() || "Untitled note";
  note.tags = $("#noteTags").value.split(",").map(tag => tag.trim()).filter(Boolean);
  note.content = $("#noteContent").value;
  note.updated = new Date().toISOString();
  persist("NOTE SAVED LOCALLY");
  renderPage();
}

function removeNote(id = state.currentNoteId) {
  const note = state.notes.find(item => item.id === id);
  if (!note || !confirm(`Delete “${note.title}”?`)) return;
  state.notes = state.notes.filter(item => item.id !== id);
  state.currentNoteId = state.notes.find(item => item.page === state.currentPage)?.id || state.notes[0]?.id;
  persist("NOTE DELETED");
  renderPage();
}

function exportContext() {
  const selected = state.notes.filter(note => note.selected);
  if (!selected.length) return toast("SELECT AT LEAST ONE NOTE");
  const content = [
    "# BAIZE OS — AI CONTEXT",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    ...selected.flatMap(note => [
      `## ${note.title}`,
      `Section: ${PAGE_CONFIG[note.page]?.label || note.page}`,
      `Tags: ${note.tags.join(", ") || "none"}`,
      "",
      note.content,
      "",
      "---",
      ""
    ])
  ].join("\n");
  const format = $("#exportFormat").value;
  if (format === "clipboard") {
    navigator.clipboard.writeText(content).then(() => toast("AI CONTEXT COPIED"));
    return;
  }
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `baize-ai-context.${format === "markdown" ? "md" : "txt"}`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast("AI CONTEXT EXPORTED");
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(date));
}

function updateWordCount() {
  const words = $("#noteContent").value.trim().split(/\s+/).filter(Boolean).length;
  $("#wordCount").textContent = `${words} words`;
}

let toastTimer;
function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("show"), 1800);
}

document.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    state.currentPage = pageButton.dataset.page;
    searchTerm = "";
    activeTag = "";
    $("#globalSearch").value = "";
    state.currentNoteId = state.notes.find(note => note.page === state.currentPage)?.id || state.currentNoteId;
    persist();
    renderPage();
    $("#sidebar").classList.remove("open");
  }
  const edit = event.target.closest("[data-edit]");
  if (edit) loadEditor(edit.dataset.edit);
  const remove = event.target.closest("[data-remove]");
  if (remove) removeNote(remove.dataset.remove);
  const tag = event.target.closest("[data-tag]");
  if (tag) {
    activeTag = tag.dataset.tag;
    $("#tagFilter").value = activeTag;
    renderNotes();
  }
});

document.addEventListener("change", event => {
  if (event.target.matches("[data-select]")) {
    const note = state.notes.find(item => item.id === event.target.dataset.select);
    note.selected = event.target.checked;
    persist();
    renderSelected();
  }
  if (event.target.matches("[data-priority]")) {
    state.priorities[Number(event.target.dataset.priority)].done = event.target.checked;
    persist("PRIORITY UPDATED");
  }
});

$("#globalSearch").addEventListener("input", event => {
  searchTerm = event.target.value.trim();
  activeTag = "";
  renderNotes();
});
$("#tagFilter").addEventListener("change", event => { activeTag = event.target.value; renderNotes(); });
$("#noteContent").addEventListener("input", updateWordCount);
$("#newNote").addEventListener("click", createNote);
$("#addNoteRow").addEventListener("click", createNote);
$("#saveNote").addEventListener("click", saveCurrentNote);
$("#deleteNote").addEventListener("click", () => removeNote());
$("#exportContext").addEventListener("click", exportContext);
$("#clearSelection").addEventListener("click", () => {
  state.notes.forEach(note => note.selected = false);
  persist("SELECTION CLEARED");
  renderNotes();
  renderSelected();
});
$("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#themeToggle").addEventListener("click", () => {
  state.darkMode = !state.darkMode;
  persist(state.darkMode ? "DARK MODE ON" : "LIGHT MODE ON");
  renderPage();
});
document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    $("#globalSearch").focus();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveCurrentNote();
  }
});

renderPriorities();
renderPage();
