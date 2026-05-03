import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthTokenService } from './auth-token.service';
import { Car, ChatMessage, ChatSession, FaqEntry } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly backendOrigin =
    globalThis.location?.port === '4200' ? 'http://localhost:8081' : globalThis.location?.origin ?? '';
  private readonly baseUrl = `${this.backendOrigin}/api`;
  private socket: Socket | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly authToken: AuthTokenService
  ) {}

  private resetSocket(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket(): Socket {
    if (!this.socket) {
      const token = this.authToken.getToken() ?? '';
      this.socket = io(this.backendOrigin || '/', {
        path: '/socket.io',
        auth: { token }
      });
    }
    return this.socket;
  }

  async login(username: string, password: string) {
    const result = await firstValueFrom(
      this.http.post<{ token: string; user: { username: string; role: string; fullName: string } }>(
        `${this.baseUrl}/auth/login`,
        { username, password }
      )
    );
    this.authToken.setToken(result.token);
    this.resetSocket();
    return result;
  }

  async getCars() {
    return firstValueFrom(this.http.get<{ items: Car[] }>(`${this.baseUrl}/products/cars`));
  }

  async getFaq() {
    return firstValueFrom(this.http.get<{ items: FaqEntry[] }>(`${this.baseUrl}/products/faq`));
  }

  async createSession(clientName: string) {
    return firstValueFrom(
      this.http.post<{ item: ChatSession }>(`${this.baseUrl}/chat/sessions`, { clientName })
    );
  }

  async getSessions() {
    return firstValueFrom(this.http.get<{ items: ChatSession[] }>(`${this.baseUrl}/chat/sessions`));
  }

  async getMessages(sessionId: string) {
    return firstValueFrom(
      this.http.get<{ items: ChatMessage[] }>(`${this.baseUrl}/chat/sessions/${sessionId}/messages`)
    );
  }

  async sendMessage(sessionId: string, content: string) {
    return firstValueFrom(
      this.http.post<{ item: ChatMessage }>(`${this.baseUrl}/chat/sessions/${sessionId}/messages`, {
        content
      })
    );
  }
}
