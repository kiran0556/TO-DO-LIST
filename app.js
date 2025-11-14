// Stylish To-Do App with localStorage, filters and edit (Vanilla JS)
(() => {
  // Elements
  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const list = document.getElementById('todo-list');
  const counter = document.getElementById('counter');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const filters = document.querySelectorAll('.filter');
  const emptyState = document.getElementById('empty-state');

  // State
  let todos = []; // {id, text, completed, createdAt}
  let activeFilter = 'all';

  // Persistence
  const STORAGE_KEY = 'stylish_todos_v1';
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      todos = raw ? JSON.parse(raw) : [];
    } catch (e) {
      todos = [];
    }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); }

  // Utilities
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  }
  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString();
  }

  // CRUD
  function addTodo(text) {
    const t = text.trim();
    if (!t) return;
    todos.unshift({ id: uid(), text: t, completed: false, createdAt: Date.now() });
    save();
    render();
  }
  function toggleTodo(id) {
    const it = todos.find(x => x.id === id);
    if (!it) return;
    it.completed = !it.completed;
    save(); render();
  }
  function updateTodoText(id, newText) {
    const it = todos.find(x => x.id === id);
    if (!it) return;
    it.text = newText.trim() || it.text;
    save(); render();
  }
  function removeTodo(id) {
    todos = todos.filter(x => x.id !== id);
    save(); render();
  }
  function clearCompleted() {
    todos = todos.filter(t => !t.completed);
    save(); render();
  }

  // Rendering helpers
  function filteredTodos() {
    if (activeFilter === 'all') return todos;
    if (activeFilter === 'active') return todos.filter(t => !t.completed);
    return todos.filter(t => t.completed);
  }

  function updateCounter() {
    const total = todos.length;
    const rem = todos.filter(t => !t.completed).length;
    counter.textContent = `${rem} of ${total} task${total !== 1 ? 's' : ''} remaining`;
  }

  function createTodoNode(todo) {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.dataset.id = todo.id;

    // check button
    const checkBtn = document.createElement('button');
    checkBtn.className = 'check' + (todo.completed ? ' completed' : '');
    checkBtn.type = 'button';
    checkBtn.title = 'Toggle complete';
    checkBtn.innerHTML = `<span class="checkbox-circle" aria-hidden="true"></span>
                          <span class="checkmark" aria-hidden="true">${todo.completed ? '✓' : ''}</span>`;

    // content
    const content = document.createElement('div');
    content.className = 'todo-content';

    const textSpan = document.createElement('div');
    textSpan.className = 'todo-text' + (todo.completed ? ' completed' : '');
    textSpan.textContent = todo.text;
    textSpan.title = 'Double-click to edit';
    textSpan.tabIndex = 0;

    const meta = document.createElement('div');
    meta.className = 'meta-row';
    meta.innerHTML = `<span class="small">Added: ${formatTime(todo.createdAt)}</span>`;

    content.appendChild(textSpan);
    content.appendChild(meta);

    // actions
    const actions = document.createElement('div');
    actions.className = 'actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.type = 'button';
    editBtn.title = 'Edit task';
    editBtn.innerHTML = '✎';

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn icon-delete';
    delBtn.type = 'button';
    delBtn.title = 'Delete task';
    delBtn.textContent = '🗑';

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(checkBtn);
    li.appendChild(content);
    li.appendChild(actions);

    // event listeners
    checkBtn.addEventListener('click', () => toggleTodo(todo.id));
    delBtn.addEventListener('click', () => {
      if (confirm('Delete this task?')) removeTodo(todo.id);
    });

    // edit behaviour (double click or edit button)
    function openEditor() {
      const input = document.createElement('input');
      input.className = 'edit-input';
      input.value = todo.text;
      content.replaceChild(input, textSpan);
      input.focus();
      input.select();

      function commit() {
        const v = input.value.trim();
        if (v) updateTodoText(todo.id, v);
        else {
          // ignore empty - restore original
          render();
        }
      }
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { input.blur(); }
        if (e.key === 'Escape') { render(); }
      });
    }

    textSpan.addEventListener('dblclick', openEditor);
    editBtn.addEventListener('click', openEditor);

    return li;
  }

  function render() {
    list.innerHTML = '';
    const items = filteredTodos();
    if (items.length === 0) {
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
      items.forEach(t => list.appendChild(createTodoNode(t)));
    }
    updateCounter();
    // update filter active state
    filters.forEach(f => f.classList.toggle('active', f.dataset.filter === activeFilter));
  }

  // Init
  load();
  render();

  // Events
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addTodo(input.value);
    input.value = '';
    input.focus();
  });

  clearCompletedBtn.addEventListener('click', () => {
    if (todos.some(t => t.completed) && confirm('Remove all completed tasks?')) clearCompleted();
  });

  filters.forEach(f => f.addEventListener('click', () => {
    activeFilter = f.dataset.filter;
    render();
  }));

  // expose for debugging
  window.__stylishTodo = { todos, addTodo, toggleTodo, removeTodo, updateTodoText, render };
})();
