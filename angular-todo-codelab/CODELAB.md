# Angular Todo List Codelab 
This is Episode one of Introduction to Angular Codelabs, we will cover all key topics in this series
and by episode 10, you will have enough understanding of Angular to build Single page applications on your own.

This codelab is written like a guided class:
1) explain the idea first,
2) show a tiny example,
3) apply it to the real Todo app,
4) explain each code segment.

Goal: by the end, you understand *why* each line exists, not just how to copy code.

---

## 0) Before You Start

### What you need
- Node.js
- Angular CLI (`ng version`)

### Start the app
```bash
cd angular-todo-codelab
npm install
ng serve
```

Open `http://localhost:4200`.

---

## 1) Angular Basics First: What Is a Component?

A **component** is the core building block in Angular.
Think of it as 3 pieces that belong together:

- **TypeScript class** -> behavior and data
- **HTML template** -> what the user sees
- **CSS** -> how it looks

### Mini example (not our Todo yet)
```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-hello',
  standalone: true,
  template: `<h2>{{ message }}</h2>`,
})
export class HelloComponent {
  message = 'Hello Angular';
}
```

### Segment-by-segment explanation
- `@Component({...})`: decorator that tells Angular this class is a component.
- `selector`: the HTML tag name used to place this component.
- `standalone: true`: modern Angular style, no NgModule required.
- `template`: inline HTML (you can also use `templateUrl`).
- `message`: class field; template can read it via `{{ message }}`.

Now we will build the Todo app using the same concept.

---

## 2) Understand Your Project Files

- `src/main.ts`: app entry point (bootstraps root component)
- `src/app/app.component.ts`: logic/state
- `src/app/app.component.html`: UI
- `src/app/app.component.css`: styling

For learning, we keep everything in one root component first.

---

## 3) Build App Logic (`app.component.ts`)

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

### Deep explanation of each segment

#### A) Imports
- `CommonModule`: gives common directives/pipes used in templates.
- `signal`, `computed`: Angular reactivity primitives.
- `FormsModule`: required for `[(ngModel)]`.

#### B) Types
- `TodoFilter`: limits filter values to valid options.
- `TodoItem`: shape of each todo object.

This gives editor autocomplete and catches mistakes at compile time.

#### C) Component metadata
- `standalone: true`: no module needed.
- `imports: [CommonModule, FormsModule]`: dependencies used by template.
- `templateUrl` + `styleUrl`: external HTML/CSS files.

#### D) State fields
- `newTodoText`: input box value.
- `filter`: current tab (`all/active/completed`).
- `todos`: the source of truth for all tasks.

#### E) Computed values
- `remainingCount`: active tasks count.
- `completedCount`: done tasks count.
- `hasCompleted`: true if at least one done task.
- `filteredTodos`: list shown on screen based on current filter.

Why computed is nice: you avoid manually syncing extra variables.

#### F) Mutating methods
- `addTodo`: validates input, prepends new todo, clears input.
- `toggleTodo`: flips one todo's `done`.
- `deleteTodo`: removes one todo.
- `clearCompleted`: removes all done todos.
- `setFilter`: switches UI tab.

Each method ends with `persistTodos()` so reload keeps changes.

#### G) Persistence methods
- `loadTodos`: reads browser local storage safely.
- `persistTodos`: writes latest list.

The `try/catch` prevents app crash if local storage has invalid JSON.

---

## 4) Build Template (`app.component.html`)

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

### Deep explanation of each segment

#### A) Interpolation
`{{ title }}` and `{{ remainingCount() }}` print values from the class.

#### B) Two-way binding
`[(ngModel)]="newTodoText"` means:
- UI -> class when user types
- class -> UI when class changes value

#### C) Event binding
- `(ngSubmit)="addTodo()"`: run when form submits.
- `(click)="setFilter('all')"`: run when button is clicked.
- `(change)="toggleTodo(todo.id)"`: run when checkbox changes.

#### D) Property/class binding
- `[checked]="todo.done"` keeps checkbox in sync.
- `[class.active]="filter() === 'all'"` toggles style based on state.

#### E) Control flow
- `@if (...) { ... } @else { ... }`: conditional rendering.
- `@for (...; track todo.id)`: efficient list rendering.

`track todo.id` helps Angular update only changed rows.

---

## 5) Styling (`app.component.css`)

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

### Why these styles matter
- `:host` styles the root component itself.
- Card layout keeps content readable.
- `.done` class provides visual feedback for completed tasks.
- `.active` filter button gives UI state awareness.

---

## 6) Verification Walkthrough

Test in this order:
1. Add 3 todos.
2. Check one as done.
3. Switch filters and verify shown list.
4. Delete one task.
5. Click "Clear completed."
6. Refresh page and confirm data persists.

If any step fails, inspect matching method in `app.component.ts`.

---

## 7) Concept Recap (Important)

- **Component** = class + template + styles.
- **Binding** connects class data and UI.
- **Signals** hold state.
- **Computed** derives state (no manual syncing).
- **Control flow** (`@if`, `@for`) controls rendering.
- **Local storage** persists app state in browser.

---

## 8) Additions You Should Definitely Build Next

These are the highest-value additions for learning:

1. **Inline edit todo**
   - Add "edit mode" per item.
   - Learn conditional templates and local row state.

2. **Split into child components**
   - `TodoFormComponent`, `TodoListComponent`, `TodoItemComponent`.
   - Learn inputs/outputs and component composition.

3. **Move state to a service**
   - Keep logic in `TodoStoreService`.
   - Learn dependency injection and reusable state.

4. **Unit tests**
   - Test `addTodo`, `toggleTodo`, `deleteTodo`, filtering.
   - Learn confidence-driven development.

5. **Routing tabs**
   - `/all`, `/active`, `/completed`.
   - Learn URL-driven state.

6. **Backend integration**
   - Replace local storage with API (`HttpClient`).
   - Learn async data and error handling.

---

## 9) Teacher Mode (How to Study This Codelab)

For each section:
1. Read explanation first.
2. Type code manually (do not paste first time).
3. Run app and predict behavior before testing.
4. Break one line on purpose, observe error, then fix.

That loop will teach you Angular much faster than passive copying.

