import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import type { Client } from '../../models/client';
import { ClientService } from '../../services/client.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.css',
})
export class ClientList implements OnInit {
  listClients: Client[] = [];

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
}
