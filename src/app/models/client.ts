export interface Client {
  id?: number;
  email: string;

  sentiments?: Sentiment[];
}

export interface Sentiment {
  id?: number;
  text: string;
  type: 'positive' | 'negative';
  clientId?: number;
}