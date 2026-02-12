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
    service = new ClientService();

    // on spy les méthodes HttpClient directement
    httpMock = {
      get: vi.spyOn((service as any).http, 'get').mockReturnValue(of([...mockClients])),
      post: vi.spyOn((service as any).http, 'post').mockReturnValue(of({ id: 3, email: 'charlie@test.com' })),
      put: vi.spyOn((service as any).http, 'put').mockReturnValue(of({})),
      delete: vi.spyOn((service as any).http, 'delete').mockReturnValue(of(undefined)),
    };
  });

  it('should fetch all clients', async () => {
    const clients = await service.getAll().toPromise();
    expect(clients).toEqual(mockClients);
    expect(httpMock.get).toHaveBeenCalledWith('http://localhost:8080/api/client');
  });

  it('should create a client', async () => {
    const client = await service.create('charlie@test.com').toPromise();
    expect(client).toEqual({ id: 3, email: 'charlie@test.com' });
    expect(httpMock.post).toHaveBeenCalledWith('http://localhost:8080/api/client', { email: 'charlie@test.com' });
  });

  it('should update a client', async () => {
    await service.update(1, 'alice2@test.com').toPromise();
    expect(httpMock.put).toHaveBeenCalledWith('http://localhost:8080/api/client/1', { email: 'alice2@test.com' });
  });

  it('should remove a client', async () => {
    await service.remove(2).toPromise();
    expect(httpMock.delete).toHaveBeenCalledWith('http://localhost:8080/api/client/2');
  });
});
