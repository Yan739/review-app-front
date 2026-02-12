import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ClientService } from '../services/client.services';
import type { Client } from '../models/client';

describe('ClientService', () => {
  let service: ClientService;
  let httpMock: any;

  const mockClients: Client[] = [
    { id: 1, email: 'alice@test.com' },
    { id: 2, email: 'bob@test.com' },
  ];

  beforeEach(() => {
    httpMock = {
      get: vi.fn().mockReturnValue(of([...mockClients])),
      post: vi.fn().mockReturnValue(of({ id: 3, email: 'charlie@test.com' })),
      put: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of(undefined)),
    };

    service = new ClientService();
  });

  it('should fetch all clients', () => {
    return service.getAll().toPromise().then(clients => {
      expect(clients).toEqual(mockClients);
      expect(httpMock.get).toHaveBeenCalledWith('http://localhost:8080/api/client');
    });
  });

  it('should create a client', () => {
    return service.create('charlie@test.com').toPromise().then(client => {
      expect(client).toEqual({ id: 3, email: 'charlie@test.com' });
      expect(httpMock.post).toHaveBeenCalledWith(
        'http://localhost:8080/api/client',
        { email: 'charlie@test.com' }
      );
    });
  });

  it('should update a client', () => {
    return service.update(1, 'alice2@test.com').toPromise().then(() => {
      expect(httpMock.put).toHaveBeenCalledWith(
        'http://localhost:8080/api/client/1',
        { email: 'alice2@test.com' }
      );
    });
  });

  it('should remove a client', () => {
    return service.remove(2).toPromise().then(() => {
      expect(httpMock.delete).toHaveBeenCalledWith(
        'http://localhost:8080/api/client/2'
      );
    });
  });
});
