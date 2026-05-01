import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Car, ChatMessage, ChatSession, FaqEntry } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly backendOrigin =
    globalThis.location?.port === '4200' ? 'http://localhost:8081' : globalThis.location?.origin ?? '';
  private readonly baseUrl = `${this.backendOrigin}/api`;
  private readonly socket: Socket = io(this.backendOrigin || '/', { path: '/socket.io' });

  constructor(private readonly http: HttpClient) {}

  getSocket(): Socket {
    return this.socket;
  }

  async login(username: string, password: string) {
    return firstValueFrom(
      this.http.post<{ token: string; user: { username: string; role: string; fullName: string } }>(
        `${this.baseUrl}/auth/login`,
        { username, password }
      )
    );
  }

  async getCars() {
    return firstValueFrom(this.http.get<{ items: Car[] }>(`${this.baseUrl}/products/cars`));
  }

  async getFaq() {
    return firstValueFrom(this.http.get<{ items: FaqEntry[] }>(`${this.baseUrl}/products/faq`));
  }

  async createSession(clientName: string) {
    return firstValueFrom(this.http.post<{ item: ChatSession }>(`${this.baseUrl}/chat/sessions`, { clientName }));
  }

  async getSessions() {
    return firstValueFrom(this.http.get<{ items: ChatSession[] }>(`${this.baseUrl}/chat/sessions`));
  }

  async getMessages(sessionId: string) {
    return firstValueFrom(
      this.http.get<{ items: ChatMessage[] }>(`${this.baseUrl}/chat/sessions/${sessionId}/messages`)
    );
  }

  async sendMessage(sessionId: string, senderRole: 'client' | 'agent', senderName: string, content: string) {
    return firstValueFrom(
      this.http.post<{ item: ChatMessage }>(`${this.baseUrl}/chat/sessions/${sessionId}/messages`, {
        senderRole,
        senderName,
        content
      })
    );
  }
}
