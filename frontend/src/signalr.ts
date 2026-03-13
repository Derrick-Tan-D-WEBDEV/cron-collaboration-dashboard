import * as signalR from '@microsoft/signalr';

export class SignalRService {
  private connection: signalR.HubConnection;
  private isConnected: boolean = false;

  constructor() {
    const hubUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5001/collaborationHub'  // Development
      : '/collaborationHub'; // Production
      
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();
  }

  // Connection management
  async start(): Promise<void> {
    try {
      await this.connection.start();
      this.isConnected = true;
      console.log('SignalR Connected');
      
      // Join general activity feed
      await this.joinActivityFeed();
    } catch (error) {
      console.error('SignalR Connection Error:', error);
      this.isConnected = false;
    }
  }

  async stop(): Promise<void> {
    if (this.isConnected && this.connection) {
      await this.connection.stop();
      this.isConnected = false;
      console.log('SignalR Disconnected');
    }
  }

  // Project subscription methods
  async joinProject(projectId: string): Promise<void> {
    if (this.isConnected) {
      await this.connection.invoke('JoinProject', projectId);
    }
  }

  async leaveProject(projectId: string): Promise<void> {
    if (this.isConnected) {
      await this.connection.invoke('LeaveProject', projectId);
    }
  }

  async joinActivityFeed(): Promise<void> {
    if (this.isConnected) {
      await this.connection.invoke('JoinActivityFeed');
    }
  }

  async leaveActivityFeed(): Promise<void> {
    if (this.isConnected) {
      await this.connection.invoke('LeaveActivityFeed');
    }
  }

  // Event listeners
  onProjectUpdate(callback: (data: any) => void): void {
    this.connection.on('ProjectUpdate', callback);
  }

  onSuggestionUpdate(callback: (data: any) => void): void {
    this.connection.on('SuggestionUpdate', callback);
  }

  onActivityUpdate(callback: (activity: any) => void): void {
    this.connection.on('ActivityUpdate', callback);
  }

  onProjectActivity(callback: (activity: any) => void): void {
    this.connection.on('ProjectActivity', callback);
  }

  onStatusChange(callback: (statusUpdate: any) => void): void {
    this.connection.on('StatusChange', callback);
  }

  // Remove event listeners
  offProjectUpdate(callback: (data: any) => void): void {
    this.connection.off('ProjectUpdate', callback);
  }

  offSuggestionUpdate(callback: (data: any) => void): void {
    this.connection.off('SuggestionUpdate', callback);
  }

  offActivityUpdate(callback: (activity: any) => void): void {
    this.connection.off('ActivityUpdate', callback);
  }

  offProjectActivity(callback: (activity: any) => void): void {
    this.connection.off('ProjectActivity', callback);
  }

  offStatusChange(callback: (statusUpdate: any) => void): void {
    this.connection.off('StatusChange', callback);
  }

  // Connection state
  get connectionState(): signalR.HubConnectionState {
    return this.connection.state;
  }

  get connected(): boolean {
    return this.isConnected && this.connection.state === signalR.HubConnectionState.Connected;
  }
}

// Create singleton instance
export const signalRService = new SignalRService();