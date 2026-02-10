import { HttpClient } from "@angular/common/http";
import { Inject, inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import type { Client } from "../models/client";

@Injectable({
    providedIn: 'root'
})

export class ClientService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/api/client';

    getClients(): Observable<Client[]> {
        return this.http.get<Client[]>(this.apiUrl);
    }   

    getClientById(id: number) {
        return this.http.get(`${this.apiUrl}/${id}`);
    }

    createClient(email: string) {
        return this.http.post(this.apiUrl, {email: email});
    }

    updateClient(id: number, client: any) {
        return this.http.put(`${this.apiUrl}/${id}`, client);
    }

    deleteClient(id: number) {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}