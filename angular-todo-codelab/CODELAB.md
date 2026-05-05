# Angular Todo List Codelab (Beginner to Solid)

This codelab helps you learn Angular by building a real Todo app step by step.

You will learn:
- Angular project structure
- Standalone components
- Template binding (`{{ }}`, `[prop]`, `(event)`, `[(ngModel)]`)
- Signals and computed state
- Angular control flow (`@if`, `@for`)
- Local storage persistence

---

## 0) Prerequisites

- Node.js installed
- Angular CLI installed (`ng version` should work)

Run:

```bash
cd angular-todo-codelab
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200).

---

## 1) Understand the Starting Point

Key files:
- `src/main.ts`: bootstraps the app
- `src/app/app.component.ts`: your component logic
- `src/app/app.component.html`: your UI template
- `src/app/app.component.css`: styles

We keep this project as a **single component app** on purpose so you can focus on Angular fundamentals first.

---

## 2) Create the Data Model and State

Replace `src/app/app.component.ts` with:

```ts
import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type TodoFilter = 'all' | 'active' | 'completed';

interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected readonly title = 'Todo Codelab';
  protected newTodoText = '';
  protected readonly filter = signal<TodoFilter>('all');
  protected readonly todos = signal<TodoItem[]>(this.loadTodos());

  protected readonly remainingCount = computed(() =>
    this.todos().filter((todo) => !todo.done).length
  );

  protected readonly completedCount = computed(() =>
    this.todos().filter((todo) => todo.done).length
  );

  protected readonly hasCompleted = computed(() => this.completedCount() > 0);

  protected readonly filteredTodos = computed(() => {
    const selectedFilter = this.filter();
    const todoList = this.todos();

    if (selectedFilter === 'active') {
      return todoList.filter((todo) => !todo.done);
    }

    if (selectedFilter === 'completed') {
      return todoList.filter((todo) => todo.done);
    }

    return todoList;
  });

  protected addTodo(): void {
    const text = this.newTodoText.trim();
    if (!text) {
      return;
    }

    this.todos.update((currentTodos) => [
      {
        id: Date.now(),
        text,
        done: false
      },
      ...currentTodos
    ]);
    this.newTodoText = '';
    this.persistTodos();
  }

  protected toggleTodo(id: number): void {
    this.todos.update((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
    this.persistTodos();
  }

  protected deleteTodo(id: number): void {
    this.todos.update((currentTodos) =>
      currentTodos.filter((todo) => todo.id !== id)
    );
    this.persistTodos();
  }

  protected clearCompleted(): void {
    this.todos.update((currentTodos) =>
      currentTodos.filter((todo) => !todo.done)
    );
    this.persistTodos();
  }

  protected setFilter(nextFilter: TodoFilter): void {
    this.filter.set(nextFilter);
  }

  private loadTodos(): TodoItem[] {
    const savedTodos = localStorage.getItem('todo-codelab-items');
    if (!savedTodos) {
      return [];
    }

    try {
      const parsed = JSON.parse(savedTodos);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter(
          (item) =>
            typeof item?.id === 'number' &&
            typeof item?.text === 'string' &&
            typeof item?.done === 'boolean'
        )
        .map((item) => ({
          id: item.id,
          text: item.text,
          done: item.done
        }));
    } catch {
      return [];
    }
  }

  private persistTodos(): void {
    localStorage.setItem('todo-codelab-items', JSON.stringify(this.todos()));
  }
}
```

What you just learned:
- `signal(...)` stores reactive state.
- `computed(...)` derives values from state.
- `update(...)` is an immutable way to change arrays.
- Local storage keeps data after page reload.

---

## 3) Build the UI Template

Replace `src/app/app.component.html` with:

```html
<main class="todo-page">
  <section class="todo-card">
    <h1>{{ title }}</h1>
    <p class="subtitle">Build healthy habits one task at a time.</p>

    <form class="todo-form" (ngSubmit)="addTodo()">
      <input
        type="text"
        name="newTodoText"
        [(ngModel)]="newTodoText"
        placeholder="What do you need to do?"
        autocomplete="off"
      />
      <button type="submit">Add</button>
    </form>

    <div class="toolbar">
      <p>{{ remainingCount() }} left · {{ completedCount() }} completed</p>
      <div class="filters">
        <button
          type="button"
          [class.active]="filter() === 'all'"
          (click)="setFilter('all')"
        >
          All
        </button>
        <button
          type="button"
          [class.active]="filter() === 'active'"
          (click)="setFilter('active')"
        >
          Active
        </button>
        <button
          type="button"
          [class.active]="filter() === 'completed'"
          (click)="setFilter('completed')"
        >
          Completed
        </button>
      </div>
    </div>

    @if (filteredTodos().length === 0) {
      <p class="empty-state">No todos match this filter yet.</p>
    } @else {
      <ul class="todo-list">
        @for (todo of filteredTodos(); track todo.id) {
          <li [class.done]="todo.done">
            <label>
              <input
                type="checkbox"
                [checked]="todo.done"
                (change)="toggleTodo(todo.id)"
              />
              <span>{{ todo.text }}</span>
            </label>
            <button type="button" class="delete" (click)="deleteTodo(todo.id)">
              Delete
            </button>
          </li>
        }
      </ul>
    }

    @if (hasCompleted()) {
      <button type="button" class="clear-completed" (click)="clearCompleted()">
        Clear completed
      </button>
    }
  </section>
</main>
```

What you just learned:
- `{{ title }}`: interpolation
- `[(ngModel)]`: two-way binding
- `(ngSubmit)` and `(click)`: event binding
- `[class.active]`: property binding
- `@if` and `@for`: Angular control flow blocks

---

## 4) Style the App

Replace `src/app/app.component.css` with:

```css
:host {
  display: block;
  min-height: 100vh;
  background: linear-gradient(160deg, #0f172a, #1e293b);
  color: #e2e8f0;
  font-family: "Segoe UI", Arial, sans-serif;
}

.todo-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  box-sizing: border-box;
}

.todo-card {
  width: min(680px, 100%);
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.45);
}

h1 {
  margin: 0;
  font-size: 2rem;
}

.subtitle {
  margin-top: 0.5rem;
  color: #94a3b8;
}

.todo-form {
  margin-top: 1.2rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.6rem;
}

input[type="text"] {
  border: 1px solid #475569;
  background: #0b1220;
  color: #f8fafc;
  border-radius: 0.6rem;
  padding: 0.72rem 0.85rem;
  font-size: 1rem;
}

button {
  border: none;
  border-radius: 0.6rem;
  padding: 0.65rem 0.85rem;
  cursor: pointer;
  color: #e2e8f0;
  background: #334155;
}

.todo-form button {
  background: #2563eb;
}

.toolbar {
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.toolbar p {
  margin: 0;
  color: #94a3b8;
}

.filters {
  display: flex;
  gap: 0.45rem;
}

.filters button.active {
  background: #1d4ed8;
}

.todo-list {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.55rem;
}

.todo-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  background: #111827;
  border: 1px solid #334155;
  border-radius: 0.65rem;
  padding: 0.72rem 0.8rem;
}

.todo-list label {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.todo-list span {
  word-break: break-word;
}

.todo-list li.done span {
  text-decoration: line-through;
  color: #94a3b8;
}

.delete {
  background: #991b1b;
}

.clear-completed {
  margin-top: 1rem;
  background: #7c2d12;
}

.empty-state {
  margin-top: 1rem;
  color: #94a3b8;
}
```

---

## 5) Run and Test the Features

Checklist:
- Add a todo
- Mark it completed
- Filter by Active / Completed / All
- Delete one todo
- Clear completed
- Reload page (data should still be there)

If this works, your fundamentals are strong.

---

## 6) Deep Dive: Why This Architecture Works

- **Single source of truth**: `todos` signal stores all items.
- **Derived state only**: counts and filtered list are computed, not manually stored.
- **Immutable updates**: prevents confusing side effects and works well with Angular change detection.
- **Template-driven form for simplicity**: quickest way for beginner input handling.

---

## 7) Suggested Additions (Highly Recommended)

These are excellent next steps:

1. **Edit todo text inline**  
   Learn conditional templates and focus management.

2. **Keyboard shortcuts**  
   - Enter to add
   - Escape to clear input  
   Learn event handling polish.

3. **Due dates + priority**  
   Introduces richer data models and sorting.

4. **Split into reusable components**  
   Create `TodoFormComponent`, `TodoListComponent`, `TodoItemComponent`.

5. **Move state into a service**  
   Learn dependency injection and share state across pages.

6. **Unit tests**  
   Test add/toggle/delete/filter logic.

7. **Routing for filter tabs**  
   Use URLs like `/all`, `/active`, `/completed`.

8. **Backend integration**  
   Replace local storage with a REST API and `HttpClient`.

---

## 8) Stretch Challenge

Implement:
- Drag-and-drop ordering (Angular CDK)
- "Mark all as completed"
- Undo last action

If you finish this, you are already beyond basic CRUD tutorials.

