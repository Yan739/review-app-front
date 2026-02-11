import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Sentiment } from '../models/client';

const BASE = 'http://localhost:8080/api/sentiment';

@Injectable({ providedIn: 'root' })
export class SentimentService {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<Sentiment[]>(BASE);
  }

  create(
    text: string,
    type: 'POSITIF' | 'NEGATIF',
    clientId: number
  ) {
    return this.http.post<Sentiment>(BASE, {
      text,
      type,
      client: { id: clientId }
    });
  }

  update(
    id: number | undefined,
    text: string,
    type: 'POSITIF' | 'NEGATIF'
  ) {
    if (id == null) {
      throw new Error('SentimentService.update appelé sans id');
    }

    return this.http.put<Sentiment>(`${BASE}/${id}`, {
      text,
      type
    });
  }

  remove(id: number) {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
