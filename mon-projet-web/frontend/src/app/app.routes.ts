import { Routes } from '@angular/router';
import { AgentComponent } from './pages/agent/agent.component';
import { ChatComponent } from './pages/chat/chat.component';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'agent', component: AgentComponent },
  { path: '**', redirectTo: '' }
];
