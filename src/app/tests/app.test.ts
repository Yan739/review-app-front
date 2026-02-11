import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import type { Client, Sentiment } from '../models/client';

// ── Factories ────────────────────────────────────────────────────────────────
const clients: Client[] = [
  { id: 1, email: 'alice@test.com' },
  { id: 2, email: 'bob@test.com' },
];

const sentiments: Sentiment[] = [
  { id: 1, text: 'Excellent rapport qualité-prix.', type: 'POSITIF', client: { id: 1 } },
  { id: 2, text: 'Livraison trop lente cette fois.', type: 'NEGATIF', client: { id: 2 } },
  { id: 3, text: 'Service client très réactif.', type: 'POSITIF', client: { id: 1 } },
];

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

async function buildComponent(clientSvc = makeClientSvc(), sentimentSvc = makeSentimentSvc()) {
  const { AppComponent } = await import('../app');
  const comp = new AppComponent();
  // @ts-expect-error inject mocks
  comp['clientSvc']    = clientSvc;
  // @ts-expect-error inject mocks
  comp['sentimentSvc'] = sentimentSvc;
  comp.ngOnInit();
  return { comp, clientSvc, sentimentSvc };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AppComponent – state logic', () => {

  // ── Init ───────────────────────────────────────────────────────────────────
  describe('ngOnInit', () => {
    it('loads clients and sentiments on init', async () => {
      const { comp } = await buildComponent();
      expect(comp.clients()).toEqual(clients);
      expect(comp.sentiments()).toEqual(sentiments);
    });

    it('starts on the clients tab', async () => {
      const { comp } = await buildComponent();
      expect(comp.tab()).toBe('clients');
    });
  });

  // ── Computed ───────────────────────────────────────────────────────────────
  describe('posCount / negCount', () => {
    it('counts POSITIF sentiments correctly', async () => {
      const { comp } = await buildComponent();
      expect(comp.posCount()).toBe(2);
    });

    it('counts NEGATIF sentiments correctly', async () => {
      const { comp } = await buildComponent();
      expect(comp.negCount()).toBe(1);
    });

    it('posCount + negCount equals total', async () => {
      const { comp } = await buildComponent();
      expect(comp.posCount() + comp.negCount()).toBe(comp.sentiments().length);
    });
  });

  // ── clientEmail helper ─────────────────────────────────────────────────────
  describe('clientEmail()', () => {
    it('resolves email via client.id', async () => {
      const { comp } = await buildComponent();
      expect(comp.clientEmail(sentiments[0])).toBe('alice@test.com');
      expect(comp.clientEmail(sentiments[1])).toBe('bob@test.com');
    });

    it('falls back to clientId when client object is absent', async () => {
      const { comp } = await buildComponent();
      const s: Sentiment = { id: 5, text: 'Via flat clientId.', type: 'POSITIF', client: { id: 2 } };
      expect(comp.clientEmail(s)).toBe('bob@test.com');
    });

    it('returns "—" when no matching client', async () => {
      const { comp } = await buildComponent();
      const s: Sentiment = { id: 9, text: 'Inconnu.', type: 'POSITIF', client: { id: 999 } };
      expect(comp.clientEmail(s)).toBe('—');
    });
  });

  // ── addClient ──────────────────────────────────────────────────────────────
  describe('addClient()', () => {
    it('does not call service when newEmail is empty', async () => {
      const { comp, clientSvc } = await buildComponent();
      comp.newEmail = '   ';
      comp.addClient();
      expect(clientSvc.create).not.toHaveBeenCalled();
    });

    it('calls create with trimmed email', async () => {
      const { comp, clientSvc } = await buildComponent();
      comp.newEmail = '  new@test.com  ';
      comp.addClient();
      expect(clientSvc.create).toHaveBeenCalledWith('new@test.com');
    });

    it('clears newEmail after successful create', async () => {
      const { comp } = await buildComponent();
      comp.newEmail = 'clear@test.com';
      comp.addClient();
      expect(comp.newEmail).toBe('');
    });
  });

  // ── startEditClient / saveClient ───────────────────────────────────────────
  describe('startEditClient() / saveClient()', () => {
    it('sets editClientId and editEmailVal on startEditClient', async () => {
      const { comp } = await buildComponent();
      comp.startEditClient(clients[0]);
      expect(comp.editClientId()).toBe(1);
      expect(comp.editEmailVal).toBe('alice@test.com');
    });

    it('does not call update when editEmailVal is empty', async () => {
      const { comp, clientSvc } = await buildComponent();
      comp.startEditClient(clients[0]);
      comp.editEmailVal = '   ';
      comp.saveClient(1);
      expect(clientSvc.update).not.toHaveBeenCalled();
    });

    it('calls update with trimmed value', async () => {
      const { comp, clientSvc } = await buildComponent();
      comp.startEditClient(clients[0]);
      comp.editEmailVal = '  edited@test.com  ';
      comp.saveClient(1);
      expect(clientSvc.update).toHaveBeenCalledWith(1, 'edited@test.com');
    });

    it('clears editClientId after save', async () => {
      const { comp } = await buildComponent();
      comp.startEditClient(clients[0]);
      comp.editEmailVal = 'x@x.com';
      comp.saveClient(1);
      expect(comp.editClientId()).toBeUndefined();
    });
  });

  // ── removeClient ───────────────────────────────────────────────────────────
  describe('removeClient()', () => {
    it('calls remove with the correct id', async () => {
      const { comp, clientSvc } = await buildComponent();
      comp.removeClient(1);
      expect(clientSvc.remove).toHaveBeenCalledWith(1);
    });
  });

  // ── addSentiment ───────────────────────────────────────────────────────────
  describe('addSentiment()', () => {
    it('does not call service when text is empty', async () => {
      const { comp, sentimentSvc } = await buildComponent();
      comp.newText = '';
      comp.newClientId = 1;
      comp.addSentiment();
      expect(sentimentSvc.create).not.toHaveBeenCalled();
    });

    it('does not call service when clientId is undefined', async () => {
      const { comp, sentimentSvc } = await buildComponent();
      comp.newText = 'Texte valide pour ce test.';
      comp.newClientId = undefined;
      comp.addSentiment();
      expect(sentimentSvc.create).not.toHaveBeenCalled();
    });

    it('calls create with trimmed text, type and clientId', async () => {
      const { comp, sentimentSvc } = await buildComponent();
      comp.newText = '  Bon produit reçu rapidement.  ';
      comp.newType = 'POSITIF';
      comp.newClientId = 2;
      comp.addSentiment();
      expect(sentimentSvc.create).toHaveBeenCalledWith('Bon produit reçu rapidement.', 'POSITIF', 2);
    });

    it('resets form fields after successful create', async () => {
      const { comp } = await buildComponent();
      comp.newText = 'Texte de test valide ici.';
      comp.newType = 'NEGATIF';
      comp.newClientId = 1;
      comp.addSentiment();
      expect(comp.newText).toBe('');
      expect(comp.newType).toBe('POSITIF');
      expect(comp.newClientId).toBeUndefined();
    });
  });

  // ── startEditSentiment / saveSentiment ─────────────────────────────────────
  describe('startEditSentiment() / saveSentiment()', () => {
    it('sets editSentimentId, editTextVal, editTypeVal', async () => {
      const { comp } = await buildComponent();
      comp.startEditSentiment(sentiments[0]);
      expect(comp.editSentimentId()).toBe(1);
      expect(comp.editTextVal).toBe(sentiments[0].text);
      expect(comp.editTypeVal).toBe('POSITIF');
    });

    it('does not call update when editTextVal is empty', async () => {
      const { comp, sentimentSvc } = await buildComponent();
      comp.startEditSentiment(sentiments[0]);
      comp.editTextVal = '';
      comp.saveSentiment(1);
      expect(sentimentSvc.update).not.toHaveBeenCalled();
    });

    it('calls update with trimmed text and type', async () => {
      const { comp, sentimentSvc } = await buildComponent();
      comp.startEditSentiment(sentiments[0]);
      comp.editTextVal = '  Avis corrigé et mis à jour.  ';
      comp.editTypeVal = 'NEGATIF';
      comp.saveSentiment(1);
      expect(sentimentSvc.update).toHaveBeenCalledWith(1, 'Avis corrigé et mis à jour.', 'NEGATIF');
    });

    it('clears editSentimentId after save', async () => {
      const { comp } = await buildComponent();
      comp.startEditSentiment(sentiments[0]);
      comp.editTextVal = 'Texte valide après correction.';
      comp.saveSentiment(1);
      expect(comp.editSentimentId()).toBeUndefined();
    });
  });

  // ── removeSentiment ────────────────────────────────────────────────────────
  describe('removeSentiment()', () => {
    it('calls remove with the correct id', async () => {
      const { comp, sentimentSvc } = await buildComponent();
      comp.removeSentiment(2);
      expect(sentimentSvc.remove).toHaveBeenCalledWith(2);
    });
  });
});