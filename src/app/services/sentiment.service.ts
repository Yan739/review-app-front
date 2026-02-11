import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Sentiment } from '../models/client';

const BASE = 'http://localhost:8080/sentiment';

@Injectable({ providedIn: 'root' })
export class SentimentService {
  private http = inject(HttpClient);

  getAll()   { return this.http.get<Sentiment[]>(BASE); }
  create(text: string, type: 'positive' | 'negative', clientId: number) {
    return this.http.post<Sentiment>(BASE, { text, type, client: { id: clientId } });
  }
  update(id: number, text: string, type: 'positive' | 'negative') {
    return this.http.put<Sentiment>(`${BASE}/${id}`, { text, type });
  }
  remove(id: number) { return this.http.delete<void>(`${BASE}/${id}`); }
}