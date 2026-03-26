
   ──────────────────────────────────────────────────────────── */
const taskInput     = document.getElementById("task-input");      // text input
const addBtn        = document.getElementById("add-btn");          // Add Task button
const taskList      = document.getElementById("task-list");        // <ul> task list
const errorMsg      = document.getElementById("error-msg");        // empty-input error
const emptyState    = document.getElementById("empty-state");      // "no tasks" message
const clearDoneBtn  = document.getElementById("clear-done-btn");   // Clear Done button
const filterTabs    = document.querySelectorAll(".filter-tab");    // All / Pending / Done tabs


const countTotal    = document.getElementById("count-total");
const countPending  = document.getElementById("count-pending");
const countDone     = document.getElementById("count-done");


let tasks = [];          // Array of task objects: { id, text, completed }
let currentFilter = "all";  // Active filter: "all" | "pending" | "completed"


function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function addTask() {
  const rawText = taskInput.value;          // get raw value
  const text    = rawText.trim();           // remove extra whitespace

  if (text === "") {
    showError("⚠️ Please enter a task before adding.");
    taskInput.focus();
    return;
  }


  clearError();

  const newTask = {
    id:        generateId(),   // unique identifier
    text:      text,           // task description
    completed: false           // not done yet
  };


  tasks.unshift(newTask);


  taskInput.value = "";
  taskInput.focus();


  renderTasks();
  updateCounts();
}

/* ────────────────────────────────────────────────────────────
   5. DELETE TASK
   — Removes a task from the array by its id, with a
     CSS slide-out animation before removal
   ──────────────────────────────────────────────────────────── */
function deleteTask(id) {
  // Find the list item element on the page
  const listItem = document.querySelector(`[data-id="${id}"]`);

  if (listItem) {
    // Add 'removing' class to trigger the CSS slide-out animation
    listItem.classList.add("removing");

    // Wait for animation to finish, then remove from array and re-render
    setTimeout(() => {
      tasks = tasks.filter(task => task.id !== id);
      renderTasks();
      updateCounts();
    }, 260); // matches animation duration in CSS
  }
}

/* ────────────────────────────────────────────────────────────
   6. TOGGLE TASK COMPLETION
   — Flips the completed state of a task
   ──────────────────────────────────────────────────────────── */
function toggleComplete(id) {
  // Find the task and flip its completed boolean
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    renderTasks();
    updateCounts();
  }
}

/* ────────────────────────────────────────────────────────────
   7. ENTER EDIT MODE
   — Swaps the task text span for an editable input field
   ──────────────────────────────────────────────────────────── */
function enterEditMode(id) {
  const listItem   = document.querySelector(`[data-id="${id}"]`);
  const taskText   = listItem.querySelector(".task-text");
  const editInput  = listItem.querySelector(".edit-input");
  const editBtn    = listItem.querySelector(".btn-edit");
  const saveBtn    = listItem.querySelector(".btn-save");

  // Copy current text into the edit input
  editInput.value = taskText.textContent;

  // Hide text span, show edit input
  taskText.style.display  = "none";
  editInput.style.display = "block";

  // Hide edit button, show save button
  editBtn.style.display = "none";
  saveBtn.style.display = "inline-block";

  // Focus the input and put cursor at end
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  // Allow pressing Enter to save
  editInput.addEventListener("keydown", function handleEnter(e) {
    if (e.key === "Enter") {
      saveTask(id);
      editInput.removeEventListener("keydown", handleEnter);
    }
    if (e.key === "Escape") {
      cancelEdit(id);
      editInput.removeEventListener("keydown", handleEnter);
    }
  });
}

/* ────────────────────────────────────────────────────────────
   8. SAVE EDITED TASK
   — Reads the edited input, validates, updates the task object
   ──────────────────────────────────────────────────────────── */
function saveTask(id) {
  const listItem  = document.querySelector(`[data-id="${id}"]`);
  const editInput = listItem.querySelector(".edit-input");
  const newText   = editInput.value.trim();

  // Do not allow saving an empty task
  if (newText === "") {
    editInput.style.borderColor = "var(--danger)";
    editInput.focus();
    return;
  }

  // Update the task text in the array
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.text = newText;
  }

  // Re-render the list to reflect the change
  renderTasks();
  updateCounts();
}

/* ────────────────────────────────────────────────────────────
   9. CANCEL EDIT (Escape key)
   — Reverts UI back to display mode without saving
   ──────────────────────────────────────────────────────────── */
function cancelEdit(id) {
  // Simply re-render — this will recreate the item in view mode
  renderTasks();
}

/* ────────────────────────────────────────────────────────────
   10. CLEAR ALL COMPLETED TASKS
   ──────────────────────────────────────────────────────────── */
function clearCompleted() {
  // Keep only tasks that are NOT completed
  tasks = tasks.filter(task => !task.completed);
  renderTasks();
  updateCounts();
}

/* ────────────────────────────────────────────────────────────
   11. RENDER TASKS
   — Clears the list and redraws all tasks that match
     the current active filter
   ──────────────────────────────────────────────────────────── */
function renderTasks() {
  // Decide which tasks to show based on the current filter
  let filteredTasks;
  if (currentFilter === "pending") {
    filteredTasks = tasks.filter(t => !t.completed);
  } else if (currentFilter === "completed") {
    filteredTasks = tasks.filter(t => t.completed);
  } else {
    filteredTasks = tasks; // "all"
  }

  // Clear the current list
  taskList.innerHTML = "";

  // Show or hide the empty state illustration
  if (filteredTasks.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  // Build a list item for each task
  filteredTasks.forEach(task => {
    const li = document.createElement("li");
    li.classList.add("task-item");
    if (task.completed) li.classList.add("completed");
    li.setAttribute("data-id", task.id);        // store ID for reference
    li.setAttribute("role", "listitem");

    li.innerHTML = `
      <!-- Checkbox to mark task done/undone -->
      <input
        type="checkbox"
        class="task-checkbox"
        ${task.completed ? "checked" : ""}
        aria-label="Mark task as ${task.completed ? "incomplete" : "complete"}"
        onchange="toggleComplete('${task.id}')"
      />

      <!-- Task text (shown in view mode) -->
      <span class="task-text">${escapeHTML(task.text)}</span>

      <!-- Edit input (shown only during editing) -->
      <input
        type="text"
        class="edit-input"
        value="${escapeHTML(task.text)}"
        maxlength="120"
        aria-label="Edit task"
      />

      <!-- Action buttons -->
      <div class="task-actions">
        <button class="btn-action btn-edit"   onclick="enterEditMode('${task.id}')" title="Edit task">Edit</button>
        <button class="btn-action btn-save"   onclick="saveTask('${task.id}')"      title="Save changes">Save</button>
        <button class="btn-action btn-delete" onclick="deleteTask('${task.id}')"    title="Delete task">Delete</button>
      </div>
    `;

    taskList.appendChild(li);
  });
}

/* ────────────────────────────────────────────────────────────
   12. UPDATE STAT COUNTERS
   — Recalculates total, pending, done counts
   ──────────────────────────────────────────────────────────── */
function updateCounts() {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.completed).length;
  const pending = total - done;

  // Animate number update by briefly scaling up
  animateCount(countTotal,   total);
  animateCount(countPending, pending);
  animateCount(countDone,    done);
}

/* Small helper: briefly scale the number for visual feedback */
function animateCount(el, newValue) {
  el.style.transform = "scale(1.25)";
  el.textContent = newValue;
  setTimeout(() => { el.style.transition = "transform 0.2s ease"; el.style.transform = "scale(1)"; }, 150);
}

/* ────────────────────────────────────────────────────────────
   13. FILTER TASKS
   — Changes the active filter and re-renders
   ──────────────────────────────────────────────────────────── */
function setFilter(filter) {
  currentFilter = filter;

  // Update active class on tabs
  filterTabs.forEach(tab => {
    tab.classList.toggle("active", tab.dataset.filter === filter);
  });

  renderTasks();
}

/* ────────────────────────────────────────────────────────────
   14. SHOW / CLEAR ERROR MESSAGE
   ──────────────────────────────────────────────────────────── */
function showError(message) {
  errorMsg.textContent = message;
  taskInput.style.borderColor = "var(--danger)";
  // Auto-clear after 3 seconds
  setTimeout(clearError, 3000);
}

function clearError() {
  errorMsg.textContent = "";
  taskInput.style.borderColor = "";
}

/* ────────────────────────────────────────────────────────────
   15. ESCAPE HTML
   — Prevents XSS by escaping special characters in task text
   ──────────────────────────────────────────────────────────── */
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ────────────────────────────────────────────────────────────
   16. EVENT LISTENERS
   ──────────────────────────────────────────────────────────── */

// Add task on button click
addBtn.addEventListener("click", addTask);

// Add task on pressing Enter key in the input field
taskInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") addTask();
});

// Clear error styling when user starts typing again
taskInput.addEventListener("input", clearError);

// Clear all completed tasks button
clearDoneBtn.addEventListener("click", clearCompleted);

// Filter tab clicks
filterTabs.forEach(tab => {
  tab.addEventListener("click", () => setFilter(tab.dataset.filter));
});

/* ────────────────────────────────────────────────────────────
   17. INITIALISE APP
   — Render empty state and set initial counts on page load
   ──────────────────────────────────────────────────────────── */
function init() {
  renderTasks();   // show empty state
  updateCounts();  // show 0 / 0 / 0
  taskInput.focus(); // auto-focus input for quick typing
}

// Run on page load
init();
