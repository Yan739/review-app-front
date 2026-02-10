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

  it('should create a client', () => {
    const email = 'new@example.com';
    service.createClient(email).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne('http://localhost:8080/api/client');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: email });
    req.flush({ id: 2, email });
  });

  it('should delete a client', () => {
    service.deleteClient(1).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne('http://localhost:8080/api/client/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should update a client', () => {
    const payload = { email: 'updated@example.com' };
    service.updateClient(1, payload).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne('http://localhost:8080/api/client/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 1, ...payload });
  });
});
