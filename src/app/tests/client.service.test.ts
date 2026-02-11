import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import type { Client } from '../models/client';

// ── Minimal fake for HttpClient ──────────────────────────────────────────────
function makeHttp(overrides: Partial<{ get: unknown; post: unknown; put: unknown; delete: unknown }> = {}) {
  return {
    get:    vi.fn().mockReturnValue(of([])),
    post:   vi.fn().mockReturnValue(of({})),
    put:    vi.fn().mockReturnValue(of({})),
    delete: vi.fn().mockReturnValue(of(undefined)),
    ...overrides,
  };
}

async function buildService(http: ReturnType<typeof makeHttp>) {
  const { ClientService } = await import('../services/client.services');
  const svc = new ClientService();
  // @ts-expect-error – inject private field for testing
  svc['http'] = http;
  return svc;
}

const BASE = 'http://localhost:8080/client';

const mockClients: Client[] = [
  { id: 1, email: 'alice@test.com' },
  { id: 2, email: 'bob@test.com' },
];

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ClientService', () => {

  describe('getAll()', () => {
    it('calls GET /client and returns clients', () => {
      const http = makeHttp({ get: vi.fn().mockReturnValue(of(mockClients)) });
      buildService(http).then(svc => {
        svc.getAll().subscribe(result => {
          expect(result).toEqual(mockClients);
          expect(http.get).toHaveBeenCalledWith(BASE);
        });
      });
    });

    it('returns empty array when no clients', () => {
      const http = makeHttp({ get: vi.fn().mockReturnValue(of([])) });
      buildService(http).then(svc => {
        svc.getAll().subscribe(result => expect(result).toEqual([]));
      });
    });
  });

  describe('create(email)', () => {
    it('calls POST /client with { email } body', () => {
      const created: Client = { id: 3, email: 'new@test.com' };
      const http = makeHttp({ post: vi.fn().mockReturnValue(of(created)) });
      buildService(http).then(svc => {
        svc.create('new@test.com').subscribe(result => {
          expect(result).toEqual(created);
          expect(http.post).toHaveBeenCalledWith(BASE, { email: 'new@test.com' });
        });
      });
    });
  });

  describe('update(id, email)', () => {
    it('calls PUT /client/:id with { email } body', () => {
      const updated: Client = { id: 1, email: 'updated@test.com' };
      const http = makeHttp({ put: vi.fn().mockReturnValue(of(updated)) });
      buildService(http).then(svc => {
        svc.update(1, 'updated@test.com').subscribe(result => {
          expect(result).toEqual(updated);
          expect(http.put).toHaveBeenCalledWith(`${BASE}/1`, { email: 'updated@test.com' });
        });
      });
    });
  });

  describe('remove(id)', () => {
    it('calls DELETE /client/:id', () => {
      const http = makeHttp({ delete: vi.fn().mockReturnValue(of(undefined)) });
      buildService(http).then(svc => {
        svc.remove(1).subscribe(() => {
          expect(http.delete).toHaveBeenCalledWith(`${BASE}/1`);
        });
      });
    });
  });
});