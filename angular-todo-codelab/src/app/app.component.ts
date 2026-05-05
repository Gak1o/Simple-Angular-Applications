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
