import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { ChatMessage, ChatSession } from '../../shared/models';

@Component({
  selector: 'app-agent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent.component.html',
  styleUrl: './agent.component.css'
})
export class AgentComponent implements OnInit, OnDestroy {
  agentName = 'Conseiller Demo';
  sessions: ChatSession[] = [];
  visibleSessions: ChatSession[] = [];
  selectedSessionId = '';
  messages: ChatMessage[] = [];
  message = '';
  filter = '';
  sortBy: 'timeDesc' | 'timeAsc' = 'timeDesc';
  loginError = '';

  private readonly socket;
  private readonly messageListener = (incoming: ChatMessage) => {
    if (incoming.sessionId === this.selectedSessionId) {
      this.messages = [...this.messages, incoming];
    }
    this.loadSessions();
  };

  private readonly sessionListener = () => {
    this.loadSessions();
  };

  constructor(private readonly apiService: ApiService) {
    this.socket = this.apiService.getSocket();
  }

  async ngOnInit() {
    this.socket.on('chat-message', this.messageListener);
    this.socket.on('chat-session-opened', this.sessionListener);

    try {
      await this.apiService.login('agent', 'agent123');
      await this.loadSessions();
    } catch {
      this.loginError = 'Connexion agent impossible.';
    }
  }

  ngOnDestroy() {
    this.socket.off('chat-message', this.messageListener);
    this.socket.off('chat-session-opened', this.sessionListener);
  }

  async loadSessions() {
    const response = await this.apiService.getSessions();
    this.sessions = response.items;
    this.refreshVisibleSessions();
  }

  refreshVisibleSessions() {
    const filterValue = this.filter.trim().toLowerCase();
    const list = this.sessions.filter((session) => {
      if (!filterValue) {
        return true;
      }
      const lastMessageText = session.lastMessage?.content?.toLowerCase() ?? '';
      return (
        session.clientName.toLowerCase().includes(filterValue) || lastMessageText.includes(filterValue)
      );
    });

    list.sort((a, b) => {
      const aTime = Date.parse(a.lastMessage?.sentAt ?? a.createdAt);
      const bTime = Date.parse(b.lastMessage?.sentAt ?? b.createdAt);
      return this.sortBy === 'timeDesc' ? bTime - aTime : aTime - bTime;
    });

    this.visibleSessions = list;
  }

  async selectSession(sessionId: string) {
    this.selectedSessionId = sessionId;
    this.socket.emit('join-session', sessionId);
    const response = await this.apiService.getMessages(sessionId);
    this.messages = response.items;
  }

  async sendMessage() {
    if (!this.selectedSessionId || !this.message.trim()) {
      return;
    }
    await this.apiService.sendMessage(this.selectedSessionId, 'agent', this.agentName, this.message.trim());
    this.message = '';
  }
}
