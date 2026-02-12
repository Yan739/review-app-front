import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ClientService } from './services/client.services';
import { SentimentService } from './services/sentiment.service';
import type { Client, Sentiment } from './models/client';

type Tab = 'clients' | 'sentiments';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
  <div class="shell">
    <!-- HEADER -->
    <header class="header">
      <div class="header-inner">
        <div class="brand">
          <span class="brand-dot"></span>
          <span class="brand-name">Review</span>
        </div>
        <nav class="tabs">
          <button class="tab"
                  [class.active]="tab() === 'clients'"
                  (click)="tab.set('clients')">
            Clients <span class="badge">{{ clients().length }}</span>
          </button>
          <button class="tab"
                  [class.active]="tab() === 'sentiments'"
                  (click)="tab.set('sentiments')">
            Avis <span class="badge">{{ sentiments().length }}</span>
          </button>
        </nav>
      </div>
    </header>

    <main class="main">

      <!-- ================= CLIENTS ================= -->
      <section *ngIf="tab() === 'clients'" class="section">

        <form class="card" (ngSubmit)="addClient()">
          <p class="form-label">Ajouter un client</p>
          <div class="field-row">
            <input class="input"
                   type="email"
                   [(ngModel)]="newEmail"
                   name="newEmail"
                   placeholder="email@domaine.com" />
            <button class="btn-primary" type="submit">Ajouter</button>
          </div>
        </form>

        <div class="list">
          <div *ngFor="let c of clients()"
               class="row"
               [class.row-editing]="editClientId() === c.id">

            <!-- AFFICHAGE -->
            <ng-container *ngIf="editClientId() !== c.id">
              <div class="row-avatar">{{ c.email[0].toUpperCase() }}</div>
              <span class="row-text">{{ c.email }}</span>
              <div class="row-actions">
                <button class="btn-icon" (click)="startEditClient(c)">✎</button>
                <button class="btn-icon danger"
                        (click)="removeClient(c.id!)">🗑</button>
              </div>
            </ng-container>

            <!-- EDITION -->
            <ng-container *ngIf="editClientId() === c.id">
              <input class="input input-inline"
                     [(ngModel)]="editEmailVal"
                     (keyup.enter)="saveClient(c.id!)"
                     (keyup.escape)="editClientId.set(undefined)"
                     autofocus />
              <div class="row-actions">
                <button class="btn-icon save"
                        (click)="saveClient(c.id!)">✓</button>
                <button class="btn-icon"
                        (click)="editClientId.set(undefined)">✕</button>
              </div>
            </ng-container>

          </div>
        </div>
      </section>

      <!-- ================= AVIS ================= -->
      <section *ngIf="tab() === 'sentiments'" class="sentiments-page">

        <!-- HEADER -->
        <div class="sentiments-header">
          <h2>Avis clients</h2>
          <div class="sentiments-stats">
            <span class="stat pos">😊 {{ posCount() }} positifs</span>
            <span class="stat neg">😞 {{ negCount() }} négatifs</span>
          </div>
        </div>

        <!-- AJOUT -->
        <form class="sentiment-create" (ngSubmit)="addSentiment()">
          <textarea class="input"
                    rows="3"
                    [(ngModel)]="newText"
                    name="newText"
                    placeholder="Que pense le client ?">
          </textarea>

          <div class="create-row">
            <select class="input"
                    [(ngModel)]="newClientId"
                    name="newClientId">
              <option [ngValue]="undefined" disabled selected>Client</option>
              <option *ngFor="let c of clients()"
                      [ngValue]="c.id">{{ c.email }}</option>
            </select>

            <select class="input"
                    [(ngModel)]="newType"
                    name="newType">
              <option value="POSITIF">😊 Positif</option>
              <option value="NEGATIF">😞 Négatif</option>
            </select>

            <button class="btn-primary" type="submit">Publier</button>
          </div>
        </form>

        <!-- LISTE -->
        <div class="sentiment-grid">
          <article *ngFor="let s of sentiments()"
                  class="sentiment-card"
                  [class.pos]="s.type === 'POSITIF'"
                  [class.neg]="s.type === 'NEGATIF'">

            <header class="card-header">
              <span class="badge">
                {{ s.type === 'POSITIF' ? '😊 Positif' : '😞 Négatif' }}
              </span>
              <span class="client">{{ clientEmail(s) }}</span>
            </header>

            <p class="card-text">{{ s.text }}</p>

            <footer class="card-actions">
              <button class="danger"
                      title="Supprimer"
                      (click)="removeSentiment(s.id!)">
                🗑
              </button>
            </footer>

          </article>
        </div>
      </section>

    </main>
  </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

    :host {
      --bg: #f5f6f8;
      --card: #ffffff;
      --border: #e3e6ea;
      --ink: #1c1f24;
      --muted: #6b7280;
      --pos: #16a34a;
      --pos-bg: #dcfce7;
      --neg: #dc2626;
      --neg-bg: #fee2e2;
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      display: block;
      min-height: 100vh;
      color: var(--ink);
    }

    .header {
      background: #111827;
      color: white;
      position: sticky;
      top: 0;
    }

    .header-inner {
      max-width: 1100px;
      margin: auto;
      padding: 0 1.5rem;
      height: 56px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand-name { font-weight: 600; }

    .tabs .tab {
      background: none;
      border: none;
      color: #9ca3af;
      margin-left: .5rem;
      cursor: pointer;
    }

    .tabs .active {
      color: white;
      font-weight: 600;
    }

    .main {
      max-width: 1100px;
      margin: auto;
      padding: 2rem 1.5rem;
    }

    .section { display: flex; flex-direction: column; gap: 1rem; }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem;
    }

    .input {
      width: 100%;
      padding: .6rem;
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .btn-primary {
      padding: .6rem 1.2rem;
      background: #111827;
      color: white;
      border-radius: 8px;
      border: none;
      margin-top: .2rem;
    }

    /* CLIENTS */
    .list { display: flex; flex-direction: column; gap: .5rem; }

    .row {
      display: flex;
      align-items: center;
      background: var(--card);
      border: 1px solid var(--border);
      padding: .75rem;
      border-radius: 10px;
      gap: .75rem;
    }

    .row-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .row-actions {
      margin-left: auto;
      display: flex;
      gap: .3rem;
    }

    .btn-icon {
      border: none;
      background: none;
      cursor: pointer;
    }

    .danger { color: var(--neg); }
    .save { color: var(--pos); }

    /* AVIS */
    .sentiments-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sentiments-stats { display: flex; gap: .5rem; }

    .stat {
      font-size: .75rem;
      padding: .3rem .6rem;
      border-radius: 999px;
    }

    .stat.pos { background: var(--pos-bg); color: var(--pos); }
    .stat.neg { background: var(--neg-bg); color: var(--neg); }

    .sentiment-create {
      background: var(--card);
      border-radius: 14px;
      border: 1px solid var(--border);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: .75rem;
    }

    .create-row {
      display: flex;
      gap: .5rem;
    }

    .sentiment-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
      margin-top: 0.5em;
    }

    .sentiment-card {
      background: var(--card);
      border-radius: 14px;
      border: 1px solid var(--border);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: .75rem;
    }

    .sentiment-card.pos { border-left: 5px solid var(--pos); }
    .sentiment-card.neg { border-left: 5px solid var(--neg); }

    .card-header {
      font-size: .75rem;
      display: flex;
      justify-content: space-between;
      color: var(--muted);
    }

    .card-text {
      font-size: .95rem;
      line-height: 1.45;
    }

    .card-actions,
    .edit-actions {
      display: flex;
      gap: .5rem;
      justify-content: flex-end;
    }

    .edit-row {
      display: flex;
      gap: .5rem;
      align-items: center;
    }
  `]
})
export class AppComponent implements OnInit {
  private clientSvc = inject(ClientService);
  private sentimentSvc = inject(SentimentService);

  tab = signal<Tab>('clients');
  clients = signal<Client[]>([]);
  sentiments = signal<Sentiment[]>([]);

  newEmail = '';
  editClientId = signal<number | undefined>(undefined);
  editEmailVal = '';

  newText = '';
  newType: 'POSITIF' | 'NEGATIF' = 'POSITIF';
  newClientId?: number;

  posCount = computed(() => this.sentiments().filter(s => s.type === 'POSITIF').length);
  negCount = computed(() => this.sentiments().filter(s => s.type === 'NEGATIF').length);

  ngOnInit() { this.refresh(); }

  refresh() {
    this.clientSvc.getAll().subscribe(v => this.clients.set(v));
    this.sentimentSvc.getAll().subscribe(v => this.sentiments.set(v));
  }

  // CLIENTS
  addClient() {
    if (!this.newEmail.trim()) return;
    this.clientSvc.create(this.newEmail)
      .subscribe(() => { this.newEmail = ''; this.refresh(); });
  }

  startEditClient(c: Client) {
    this.editClientId.set(c.id);
    this.editEmailVal = c.email;
  }

  saveClient(id: number) {
    if (!this.editEmailVal.trim()) return;
    this.clientSvc.update(id, this.editEmailVal)
      .subscribe(() => { this.editClientId.set(undefined); this.refresh(); });
  }

  removeClient(id: number) {
    if (confirm('Supprimer ce client ?')) {
      this.clientSvc.remove(id).subscribe(() => this.refresh());
    }
  }

  // AVIS
    addSentiment() {
      if (!this.newText.trim() || !this.newClientId) return;

      this.sentimentSvc.create(this.newText, this.newType, this.newClientId)
        .subscribe(() => {
          this.newText = '';
          this.newType = 'POSITIF';
          this.newClientId = undefined;
          this.refresh();
        });
    }

    removeSentiment(id: number) {
      if (confirm('Supprimer cet avis ?')) {
        this.sentimentSvc.remove(id).subscribe(() => this.refresh());
      }
    }


  clientEmail(s: Sentiment): string {
    return this.clients().find(c => c.id === s.client.id)?.email ?? '—';
  }
}
