import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Client } from '../models/client';

const BASE = 'http://localhost:8080/client';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private http = inject(HttpClient);

  getAll()                            { return this.http.get<Client[]>(BASE); }
  create(email: string)               { return this.http.post<Client>(BASE, { email }); }
  update(id: number, email: string)   { return this.http.put<Client>(`${BASE}/${id}`, { email }); }
  remove(id: number)                  { return this.http.delete<void>(`${BASE}/${id}`); }
}