import { describe, it, expect, vi } from 'vitest';
import { of } from 'rxjs';
import type { Client, Sentiment } from '../models/client';

function makeHttp(overrides = {}) {
  return {
    get:    vi.fn().mockReturnValue(of([])),
    post:   vi.fn().mockReturnValue(of({})),
    put:    vi.fn().mockReturnValue(of({})),
    delete: vi.fn().mockReturnValue(of(undefined)),
    ...overrides,
  };
}

async function buildService(http: ReturnType<typeof makeHttp>) {
  const { SentimentService } = await import('../services/sentiment.service');
  const svc = new SentimentService();
  // @ts-expect-error
  svc['http'] = http;
  return svc;
}

const BASE = 'http://localhost:8080/sentiment';

const mockSentiments: Sentiment[] = [
  { id: 1, text: 'Excellent service au quotidien.', type: 'POSITIF', client: { id: 1 } },
  { id: 2, text: 'Délais de livraison trop longs.', type: 'NEGATIF', client: { id: 2 } },
];

describe('SentimentService', () => {

  describe('getAll()', () => {
    it('calls GET /sentiment and returns sentiments', () => {
      const http = makeHttp({ get: vi.fn().mockReturnValue(of(mockSentiments)) });
      buildService(http).then(svc => {
        svc.getAll().subscribe(result => {
          expect(result).toEqual(mockSentiments);
          expect(http.get).toHaveBeenCalledWith(BASE);
        });
      });
    });
  });

  describe('create(text, type, clientId)', () => {
    it('calls POST with client nested object – not clientId flat', () => {
      const http = makeHttp({ post: vi.fn().mockReturnValue(of(mockSentiments[0])) });
      buildService(http).then(svc => {
        svc.create('Très bonne expérience globale.', 'POSITIF', 1).subscribe(() => {
          expect(http.post).toHaveBeenCalledWith(BASE, {
            text: 'Très bonne expérience globale.',
            type: 'POSITIF',
            client: { id: 1 },   
          });
        });
      });
    });

    it('body does NOT contain a flat clientId field', () => {
      const http = makeHttp({ post: vi.fn().mockReturnValue(of({})) });
      buildService(http).then(svc => {
        svc.create('Super produit livré rapidement.', 'POSITIF', 7).subscribe(() => {
          const body = (http.post as ReturnType<typeof vi.fn>).mock.calls[0][1];
          expect(body).not.toHaveProperty('clientId');
          expect(body.client).toEqual({ id: 7 });
        });
      });
    });
  });

  describe('update(id, text, type)', () => {
    it('calls PUT /sentiment/:id with text and type', () => {
      const http = makeHttp({ put: vi.fn().mockReturnValue(of(mockSentiments[0])) });
      buildService(http).then(svc => {
        svc.update(1, 'Texte mis à jour proprement.', 'NEGATIF').subscribe(() => {
          expect(http.put).toHaveBeenCalledWith(`${BASE}/1`, {
            text: 'Texte mis à jour proprement.',
            type: 'NEGATIF',
          });
        });
      });
    });
  });

  describe('remove(id)', () => {
    it('calls DELETE /sentiment/:id', () => {
      const http = makeHttp({ delete: vi.fn().mockReturnValue(of(undefined)) });
      buildService(http).then(svc => {
        svc.remove(2).subscribe(() => {
          expect(http.delete).toHaveBeenCalledWith(`${BASE}/2`);
        });
      });
    });
  });
});