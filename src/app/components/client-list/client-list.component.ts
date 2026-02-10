import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Client } from '../../models/client';
import { ClientService } from '../../services/client.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.css'],
})
export class ClientList implements OnInit {
  listClients: Client[] = [];
  newEmail = '';

  private clientService = inject(ClientService);

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients() {
    this.clientService.getClients().subscribe({
      next: (clients: Client[]) => {
        this.listClients = clients;
      },
      error: (error: any) => {
        console.error('Error fetching clients:', error);
      }
    });
  }

  createClient() {
    const email = this.newEmail?.trim();
    if (!email) return;

    this.clientService.createClient(email).subscribe({
      next: () => {
        this.newEmail = '';
        this.loadClients();
      },
      error: (err: any) => console.error('Error creating client', err)
    });
  }

  deleteClient(id?: number) {
    if (!id) return;
    this.clientService.deleteClient(id).subscribe({
      next: () => this.loadClients(),
      error: (err: any) => console.error('Error deleting client', err)
    });
  }

  trackById(_index: number, item: Client | undefined) {
    return item?.id;
  }
}
