import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { ChatMessage } from '../../shared/models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  clientName = 'Client Demo';
  sessionId = '';
  message = '';
  messages: ChatMessage[] = [];
  loading = false;
  error = '';

  private socket?: ReturnType<ApiService['getSocket']>;
  private readonly messageListener = (incoming: ChatMessage) => {
    if (incoming.sessionId === this.sessionId) {
      this.messages = [...this.messages, incoming];
    }
  };

  constructor(private readonly apiService: ApiService) {}

  ngOnInit(): void {
    void this.bootstrapClient();
  }

  private async bootstrapClient() {
    try {
      await this.apiService.login('client', 'client123');
    } catch {
      this.error = 'Connexion client impossible.';
      return;
    }
    this.socket = this.apiService.getSocket();
    this.socket.on('chat-message', this.messageListener);
  }

  ngOnDestroy() {
    this.socket?.off('chat-message', this.messageListener);
  }

  async startChat() {
    this.error = '';
    this.loading = true;
    try {
      if (!this.socket) {
        this.error = 'Session non connectee.';
        return;
      }
      const response = await this.apiService.createSession(this.clientName);
      this.sessionId = response.item.id;
      this.socket.emit('join-session', this.sessionId);
      this.messages = [];
    } catch {
      this.error = 'Impossible de creer la session de chat.';
    } finally {
      this.loading = false;
    }
  }

  async sendMessage() {
    if (!this.sessionId || !this.message.trim()) {
      return;
    }

    try {
      await this.apiService.sendMessage(this.sessionId, this.message.trim());
      this.message = '';
    } catch {
      this.error = 'Impossible d envoyer le message.';
    }
  }
}
