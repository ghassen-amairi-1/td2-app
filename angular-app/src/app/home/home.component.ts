import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { User } from '../models/User';

type SortKey = 'id' | 'firstName' | 'lastName';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  usersList: User[] = [];
  loading = true;
  loadError = false;
  saving = false;
  searchTerm = '';
  sortKey: SortKey = 'id';
  sortAsc = true;
  pendingDeleteId: string | null = null;
  removingId: string | null = null;
  toasts: Toast[] = [];
  private toastSeq = 0;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(silent = false): void {
    if (!silent) {
      this.loading = true;
    }
    this.loadError = false;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.usersList = users ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
        this.toast('Could not load the users', 'error');
      },
    });
  }

  get filteredUsers(): User[] {
    const term = this.searchTerm.trim().toLowerCase();
    const list = this.usersList.filter((u) =>
      !term ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
      this.idOf(u).includes(term)
    );
    const dir = this.sortAsc ? 1 : -1;
    return [...list].sort((a, b) => {
      if (this.sortKey === 'id') {
        return (Number(a.id) - Number(b.id)) * dir;
      }
      return String(a[this.sortKey] ?? '').localeCompare(String(b[this.sortKey] ?? '')) * dir;
    });
  }

  sortBy(key: SortKey): void {
    if (this.sortKey === key) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortKey = key;
      this.sortAsc = true;
    }
  }

  arrow(key: SortKey): string {
    return this.sortKey === key ? (this.sortAsc ? '↑' : '↓') : '';
  }

  addUser(firstInput: HTMLInputElement, lastInput: HTMLInputElement): void {
    const first = firstInput.value.trim();
    const last = lastInput.value.trim();
    if (!first || !last) {
      this.toast('Please fill in both names', 'error');
      (first ? lastInput : firstInput).focus();
      return;
    }
    this.saving = true;
    this.userService.addUser(first, last).subscribe({
      next: () => {
        this.saving = false;
        firstInput.value = '';
        lastInput.value = '';
        firstInput.focus();
        this.toast(`${first} ${last} was added`, 'success');
        this.loadUsers(true);
      },
      error: () => {
        this.saving = false;
        this.toast('Could not add the user', 'error');
      },
    });
  }

  askDelete(user: User): void {
    this.pendingDeleteId = this.idOf(user);
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
  }

  confirmDelete(user: User): void {
    const id = this.idOf(user);
    this.pendingDeleteId = null;
    this.removingId = id;
    this.userService.deleteUser(id).subscribe({
      next: () => {
        setTimeout(() => {
          this.usersList = this.usersList.filter((u) => this.idOf(u) !== id);
          this.removingId = null;
          this.toast(`${user.firstName} ${user.lastName} was deleted`, 'success');
        }, 300);
      },
      error: () => {
        this.removingId = null;
        this.toast('Could not delete the user', 'error');
      },
    });
  }

  idOf(user: User): string {
    return String(user.id ?? '');
  }

  initials(user: User): string {
    const f = String(user.firstName ?? '').charAt(0);
    const l = String(user.lastName ?? '').charAt(0);
    return (f + l).toUpperCase() || '?';
  }

  avatarColor(user: User): string {
    const text = `${user.firstName}${user.lastName}`;
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) % 360;
    }
    return `hsl(${hash}, 62%, 52%)`;
  }

  trackById = (_: number, user: User): string => this.idOf(user);

  private toast(message: string, type: 'success' | 'error'): void {
    const id = ++this.toastSeq;
    this.toasts = [...this.toasts, { id, message, type }];
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 3200);
  }
}
