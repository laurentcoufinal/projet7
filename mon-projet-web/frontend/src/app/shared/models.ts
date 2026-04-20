export interface ChatMessage {
  id: string;
  sessionId: string;
  senderRole: 'client' | 'agent';
  senderName: string;
  content: string;
  sentAt: string;
}

export interface ChatSession {
  id: string;
  clientName: string;
  status: string;
  createdAt: string;
  lastMessage: ChatMessage | null;
}

export interface Car {
  id: string;
  city: string;
  airport: string;
  model: string;
  dailyPrice: number;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}
