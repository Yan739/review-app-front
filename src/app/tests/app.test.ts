import { describe, it, expect, vi } from 'vitest';
import { of } from 'rxjs';
import type { Client, Sentiment } from '../models/client';

// Mock data
const clients: Client[] = [
  { id: 1, email: 'alice@test.com' },
  { id: 2, email: 'bob@test.com' },
];

const sentiments: Sentiment[] = [
  { id: 1, text: 'Excellent rapport qualité-prix.', type: 'POSITIF', client: { id: 1 } },
  { id: 2, text: 'Livraison trop lente cette fois.', type: 'NEGATIF', client: { id: 2 } },
  { id: 3, text: 'Service client très réactif.', type: 'POSITIF', client: { id: 1 } },
];

// Mock services
function makeClientSvc(overrides = {}) {
  return {
    getAll: vi.fn().mockReturnValue(of([...clients])),
    create: vi.fn().mockReturnValue(of({})),
    update: vi.fn().mockReturnValue(of({})),
    remove: vi.fn().mockReturnValue(of(undefined)),
    ...overrides,
  };
}

function makeSentimentSvc(overrides = {}) {
  return {
    getAll: vi.fn().mockReturnValue(of([...sentiments])),
    create: vi.fn().mockReturnValue(of({})),
    update: vi.fn().mockReturnValue(of({})),
    remove: vi.fn().mockReturnValue(of(undefined)),
    ...overrides,
  };
}

// Helper to build the component
async function buildComponent(clientSvc = makeClientSvc(), sentimentSvc = makeSentimentSvc()) {
  const { AppComponent } = await import('../app');
  const comp = new AppComponent();
  (comp as any)['clientSvc'] = clientSvc;
  (comp as any)['sentimentSvc'] = sentimentSvc;
  comp.ngOnInit();
  return { comp, clientSvc, sentimentSvc };
}

// Tests
describe('AppComponent – state logic', () => {

  it('initializes with clients, sentiments, and default tab', async () => {
    const { comp } = await buildComponent();
    expect(comp.clients()).toEqual(clients);
    expect(comp.sentiments()).toEqual(sentiments);
    expect(comp.tab()).toBe('clients');
  });

  it('computes posCount and negCount correctly', async () => {
    const { comp } = await buildComponent();
    expect(comp.posCount()).toBe(2);
    expect(comp.negCount()).toBe(1);
    expect(comp.posCount() + comp.negCount()).toBe(comp.sentiments().length);
  });

  it('resolves client emails correctly', async () => {
    const { comp } = await buildComponent();
    expect(comp.clientEmail(sentiments[0])).toBe('alice@test.com');
    expect(comp.clientEmail(sentiments[1])).toBe('bob@test.com');
    const unknown: Sentiment = { id: 9, text: 'Inconnu', type: 'POSITIF', client: { id: 999 } };
    expect(comp.clientEmail(unknown)).toBe('—');
  });

  it('addClient behavior', async () => {
    const { comp, clientSvc } = await buildComponent();

    comp.newEmail = '   ';
    comp.addClient();
    expect(clientSvc.create).not.toHaveBeenCalled();

    comp.newEmail = '  new@test.com  ';
    comp.addClient();
    expect(clientSvc.create).toHaveBeenCalledWith('new@test.com');
    expect(comp.newEmail).toBe('');
  });

  it('removeClient calls service with correct id', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    const { comp, clientSvc } = await buildComponent();
    comp.removeClient(1);
    expect(clientSvc.remove).toHaveBeenCalledWith(1);
  });

  it('addSentiment behavior', async () => {
    const { comp, sentimentSvc } = await buildComponent();

    comp.newText = '';
    comp.newClientId = 1;
    comp.addSentiment();
    expect(sentimentSvc.create).not.toHaveBeenCalled();

    comp.newText = '  Bon produit reçu rapidement.  ';
    comp.newType = 'POSITIF';
    comp.newClientId = 2;
    comp.addSentiment();
    expect(sentimentSvc.create).toHaveBeenCalledWith('Bon produit reçu rapidement.', 'POSITIF', 2);

    comp.newText = 'Texte de test.';
    comp.newType = 'NEGATIF';
    comp.newClientId = 1;
    comp.addSentiment();
    expect(comp.newText).toBe('');
    expect(comp.newType).toBe('POSITIF');
    expect(comp.newClientId).toBeUndefined();
  });

  it('removeSentiment calls service with correct id', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    const { comp, sentimentSvc } = await buildComponent();
    comp.removeSentiment(2);
    expect(sentimentSvc.remove).toHaveBeenCalledWith(2);
  });

});
