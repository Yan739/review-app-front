import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClientService } from './client.service';
import { Client } from '../models/client';

describe('ClientService', () => {
  let service: ClientService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClientService]
    });

    service = TestBed.inject(ClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch clients', () => {
    const mock: Client[] = [{ id: 1, email: 'a@example.com' }];

    service.getClients().subscribe(clients => {
      expect(clients.length).toBe(1);
      expect(clients[0].email).toBe('a@example.com');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/client');
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });
});
