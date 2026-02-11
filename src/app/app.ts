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

    <!-- Header -->
    <header class="header">
      <div class="header-inner">
        <div class="brand">
          <span class="brand-dot"></span>
          <span class="brand-name">Review</span>
        </div>
        <nav class="tabs">
          <button class="tab" [class.active]="tab() === 'clients'" (click)="tab.set('clients')">
            Clients <span class="badge">{{ clients().length }}</span>
          </button>
          <button class="tab" [class.active]="tab() === 'sentiments'" (click)="tab.set('sentiments')">
            Avis <span class="badge">{{ sentiments().length }}</span>
          </button>
        </nav>
      </div>
    </header>

    <main class="main">

      <!-- ══ CLIENTS ══ -->
      <section *ngIf="tab() === 'clients'" class="section">

        <!-- Form -->
        <form class="card form-card" (ngSubmit)="addClient()">
          <p class="form-label">Ajouter un client</p>
          <div class="field-row">
            <input class="input" type="email" placeholder="email@domaine.com"
              [(ngModel)]="newEmail" name="newEmail" autocomplete="off" />
            <button class="btn-submit" type="submit">Ajouter</button>
          </div>
        </form>

        <!-- List -->
        <div class="list">
          <div *ngFor="let c of clients()" class="row" [class.row-editing]="editClientId() === c.id">

            <!-- View -->
            <ng-container *ngIf="editClientId() !== c.id">
              <div class="row-avatar">{{ c.email[0].toUpperCase() }}</div>
              <span class="row-text">{{ c.email }}</span>
              <div class="row-actions">
                <button class="btn-ghost" (click)="startEditClient(c)">Modifier</button>
                <button class="btn-danger" (click)="removeClient(c.id!)">×</button>
              </div>
            </ng-container>

            <!-- Edit -->
            <ng-container *ngIf="editClientId() === c.id">
              <input class="input input-inline" type="email" [(ngModel)]="editEmailVal"
                [name]="'edit-' + c.id" (keyup.escape)="editClientId.set(undefined)" autofocus />
              <div class="row-actions">
                <button class="btn-ghost" (click)="saveClient(c.id!)">Sauver</button>
                <button class="btn-ghost" (click)="editClientId.set(undefined)">Annuler</button>
              </div>
            </ng-container>

          </div>

          <div *ngIf="clients().length === 0" class="empty">Aucun client enregistré.</div>
        </div>
      </section>

      <!-- ══ SENTIMENTS ══ -->
      <section *ngIf="tab() === 'sentiments'" class="section">

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-pill pos">↑ {{ posCount() }} positifs</div>
          <div class="stat-pill neg">↓ {{ negCount() }} négatifs</div>
        </div>

        <!-- Form -->
        <form class="card form-card form-sentiment" (ngSubmit)="addSentiment()">
          <p class="form-label">Ajouter un avis</p>
          <textarea class="input" rows="3" placeholder="Décrivez l'expérience (10–500 caractères)…"
            [(ngModel)]="newText" name="newText"></textarea>
          <div class="field-row">
            <select class="input" [(ngModel)]="newType" name="newType">
              <option value="positive">Positif</option>
              <option value="negative">Négatif</option>
            </select>
            <select class="input" [(ngModel)]="newClientId" name="newClientId">
              <option [ngValue]="undefined" disabled>Client…</option>
              <option *ngFor="let c of clients()" [ngValue]="c.id">{{ c.email }}</option>
            </select>
            <button class="btn-submit" type="submit">Ajouter</button>
          </div>
        </form>

        <!-- List -->
        <div class="list">
          <div *ngFor="let s of sentiments()"
            class="row sentiment-row"
            [class.row-editing]="editSentimentId() === s.id"
            [class.is-pos]="s.type === 'positive'"
            [class.is-neg]="s.type === 'negative'">

            <!-- View -->
            <ng-container *ngIf="editSentimentId() !== s.id">
              <div class="sentiment-body">
                <span class="type-dot" [class.dot-pos]="s.type === 'positive'" [class.dot-neg]="s.type === 'negative'"></span>
                <span class="row-text">{{ s.text }}</span>
              </div>
              <span class="client-tag">{{ clientEmail(s) }}</span>
              <div class="row-actions">
                <button class="btn-ghost" (click)="startEditSentiment(s)">Modifier</button>
                <button class="btn-danger" (click)="removeSentiment(s.id!)">×</button>
              </div>
            </ng-container>

            <!-- Edit -->
            <ng-container *ngIf="editSentimentId() === s.id">
              <textarea class="input input-inline" rows="2" [(ngModel)]="editTextVal"
                [name]="'editText-' + s.id" (keyup.escape)="editSentimentId.set(undefined)"></textarea>
              <select class="input" [(ngModel)]="editTypeVal" [name]="'editType-' + s.id">
                <option value="positive">Positif</option>
                <option value="negative">Négatif</option>
              </select>
              <div class="row-actions">
                <button class="btn-ghost" (click)="saveSentiment(s.id!)">Sauver</button>
                <button class="btn-ghost" (click)="editSentimentId.set(undefined)">Annuler</button>
              </div>
            </ng-container>

          </div>

          <div *ngIf="sentiments().length === 0" class="empty">Aucun avis enregistré.</div>
        </div>
      </section>

    </main>
  </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :host {
      --cream:      #f7f3ee;
      --cream-dark: #ede7dd;
      --ink:        #1a1714;
      --ink-soft:   #4a4540;
      --ink-dim:    #9a948e;
      --rule:       #ddd7cf;
      --pos:        #2d6a4f;
      --pos-bg:     #d8f3dc;
      --neg:        #9b2335;
      --neg-bg:     #fde8eb;
      --accent:     #c17f3a;
      --accent-bg:  #fdf3e6;
      font-family: 'Lora', Georgia, serif;
      color: var(--ink);
      background: var(--cream);
      display: block;
      min-height: 100vh;
    }

    /* ── Header ─────────────────────────────────── */
    .header {
      background: var(--ink);
      position: sticky; top: 0; z-index: 10;
    }
    .header-inner {
      max-width: 760px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 2rem;
      height: 56px;
    }
    .brand { display: flex; align-items: center; gap: .6rem; }
    .brand-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--accent);
    }
    .brand-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.15rem; font-weight: 700;
      color: #fff; letter-spacing: .04em;
    }

    /* ── Tabs ───────────────────────────────────── */
    .tabs { display: flex; gap: .25rem; }
    .tab {
      display: flex; align-items: center; gap: .5rem;
      padding: .4rem .9rem; border-radius: 4px; border: none;
      background: transparent; color: rgba(255,255,255,.5);
      font-family: 'Lora', serif; font-size: .82rem;
      cursor: pointer; transition: all .15s;
    }
    .tab:hover { color: rgba(255,255,255,.8); }
    .tab.active { background: rgba(255,255,255,.1); color: #fff; }
    .badge {
      font-size: .68rem; background: rgba(255,255,255,.15);
      color: rgba(255,255,255,.7); border-radius: 100px;
      padding: .1rem .4rem; font-family: 'Lora', serif;
    }
    .tab.active .badge { background: var(--accent); color: #fff; }

    /* ── Main ───────────────────────────────────── */
    .main { max-width: 760px; margin: 0 auto; padding: 2.5rem 2rem 4rem; }

    .section { display: flex; flex-direction: column; gap: 1.25rem; }

    /* ── Stats ──────────────────────────────────── */
    .stats-row { display: flex; gap: .625rem; }
    .stat-pill {
      font-size: .78rem; font-weight: 500;
      padding: .3rem .75rem; border-radius: 100px;
      font-family: 'Lora', serif;
    }
    .stat-pill.pos { background: var(--pos-bg); color: var(--pos); }
    .stat-pill.neg { background: var(--neg-bg); color: var(--neg); }

    /* ── Cards / Forms ──────────────────────────── */
    .card {
      background: #fff; border: 1px solid var(--rule);
      border-radius: 10px; padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 4px rgba(26,23,20,.04);
    }
    .form-label {
      font-size: .72rem; text-transform: uppercase;
      letter-spacing: .1em; color: var(--ink-dim);
      margin-bottom: .75rem;
    }
    .form-sentiment { display: flex; flex-direction: column; gap: .75rem; }
    .field-row { display: flex; gap: .625rem; align-items: center; }

    /* ── Inputs ─────────────────────────────────── */
    .input {
      flex: 1; padding: .6rem .875rem;
      background: var(--cream); border: 1px solid var(--rule);
      border-radius: 6px; color: var(--ink);
      font-family: 'Lora', serif; font-size: .9rem;
      transition: border-color .15s; width: 100%;
    }
    .input:focus { outline: none; border-color: var(--accent); }
    .input.input-inline { background: var(--cream-dark); flex: 1; }
    select.input { cursor: pointer; }
    textarea.input { resize: none; line-height: 1.5; }

    /* ── Buttons ────────────────────────────────── */
    .btn-submit {
      padding: .6rem 1.25rem; border-radius: 6px; border: none;
      background: var(--ink); color: #fff;
      font-family: 'Lora', serif; font-size: .875rem;
      cursor: pointer; white-space: nowrap;
      transition: background .15s;
    }
    .btn-submit:hover { background: var(--ink-soft); }
    .btn-ghost {
      padding: .45rem .75rem; border-radius: 5px;
      border: 1px solid var(--rule); background: transparent;
      color: var(--ink-soft); font-family: 'Lora', serif;
      font-size: .8rem; cursor: pointer; transition: all .15s;
      white-space: nowrap;
    }
    .btn-ghost:hover { background: var(--cream-dark); color: var(--ink); }
    .btn-danger {
      width: 28px; height: 28px; border-radius: 5px; border: none;
      background: transparent; color: var(--ink-dim);
      font-size: 1.1rem; cursor: pointer; transition: all .15s;
      display: flex; align-items: center; justify-content: center;
    }
    .btn-danger:hover { background: var(--neg-bg); color: var(--neg); }

    /* ── List rows ──────────────────────────────── */
    .list { display: flex; flex-direction: column; gap: .5rem; }

    .row {
      display: flex; align-items: center; gap: .875rem;
      padding: .875rem 1.25rem;
      background: #fff; border: 1px solid var(--rule);
      border-radius: 8px;
      transition: box-shadow .15s;
      animation: fadeUp .18s ease both;
    }
    .row:hover { box-shadow: 0 2px 10px rgba(26,23,20,.06); }
    .row-editing { border-color: var(--accent); }

    .row-avatar {
      width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
      background: var(--accent-bg); color: var(--accent);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: .9rem;
    }
    .row-text {
      flex: 1; font-size: .9rem; color: var(--ink);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .row-actions { display: flex; align-items: center; gap: .375rem; margin-left: auto; }

    /* ── Sentiment rows ─────────────────────────── */
    .sentiment-row { align-items: flex-start; flex-wrap: wrap; gap: .625rem; }
    .is-pos { border-left: 3px solid var(--pos); }
    .is-neg { border-left: 3px solid var(--neg); }

    .sentiment-body {
      flex: 1; display: flex; align-items: flex-start; gap: .625rem;
      min-width: 0;
    }
    .type-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: .45rem;
    }
    .dot-pos { background: var(--pos); }
    .dot-neg { background: var(--neg); }
    .sentiment-body .row-text { white-space: normal; line-height: 1.5; }

    .client-tag {
      font-size: .72rem; color: var(--ink-dim);
      background: var(--cream); padding: .2rem .55rem;
      border-radius: 100px; border: 1px solid var(--rule);
      white-space: nowrap;
    }

    /* ── Empty ──────────────────────────────────── */
    .empty {
      text-align: center; padding: 3rem;
      color: var(--ink-dim); font-style: italic; font-size: .9rem;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AppComponent implements OnInit {
  private clientSvc   = inject(ClientService);
  private sentimentSvc = inject(SentimentService);

  // ── State ────────────────────────────────────────────────────────────────
  tab          = signal<Tab>('clients');
  clients      = signal<Client[]>([]);
  sentiments   = signal<Sentiment[]>([]);

  // Client form
  newEmail     = '';
  editClientId = signal<number | undefined>(undefined);
  editEmailVal = '';

  // Sentiment form
  newText      = '';
  newType: 'positive' | 'negative' = 'positive';
  newClientId?: number;
  editSentimentId = signal<number | undefined>(undefined);
  editTextVal  = '';
  editTypeVal: 'positive' | 'negative' = 'positive';

  // Computed
  posCount = computed(() => this.sentiments().filter(s => s.type === 'positive').length);
  negCount = computed(() => this.sentiments().filter(s => s.type === 'negative').length);

  // ── Init ─────────────────────────────────────────────────────────────────
  ngOnInit() {
    this.loadClients();
    this.loadSentiments();
  }

  loadClients()    { this.clientSvc.getAll().subscribe(v => this.clients.set(v)); }
  loadSentiments() { this.sentimentSvc.getAll().subscribe(v => this.sentiments.set(v)); }

  // ── Clients ───────────────────────────────────────────────────────────────
  addClient() {
    const email = this.newEmail.trim();
    if (!email) return;
    this.clientSvc.create(email).subscribe(() => { this.newEmail = ''; this.loadClients(); });
  }

  startEditClient(c: Client) { this.editClientId.set(c.id); this.editEmailVal = c.email; }

  saveClient(id: number) {
    if (!this.editEmailVal.trim()) return;
    this.clientSvc.update(id, this.editEmailVal.trim()).subscribe(() => {
      this.editClientId.set(undefined);
      this.loadClients();
    });
  }

  removeClient(id: number) {
    this.clientSvc.remove(id).subscribe(() => this.loadClients());
  }

  // ── Sentiments ────────────────────────────────────────────────────────────
  addSentiment() {
    if (!this.newText.trim() || !this.newClientId) return;
    this.sentimentSvc.create(this.newText.trim(), this.newType, this.newClientId).subscribe(() => {
      this.newText = ''; this.newType = 'positive'; this.newClientId = undefined;
      this.loadSentiments();
    });
  }

  startEditSentiment(s: Sentiment) {
    this.editSentimentId.set(s.id);
    this.editTextVal = s.text;
    this.editTypeVal = s.type;
  }

  saveSentiment(id: number) {
    if (!this.editTextVal.trim()) return;
    this.sentimentSvc.update(id, this.editTextVal.trim(), this.editTypeVal).subscribe(() => {
      this.editSentimentId.set(undefined);
      this.loadSentiments();
    });
  }

  removeSentiment(id: number) {
    this.sentimentSvc.remove(id).subscribe(() => this.loadSentiments());
  }

  clientEmail(s: Sentiment): string {
    const id = s.client?.id ?? s.clientId;
    return this.clients().find(c => c.id === id)?.email ?? '—';
  }
}