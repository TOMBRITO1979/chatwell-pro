import axios, { AxiosInstance } from 'axios';

export interface WAHAConfig {
  apiUrl: string;
  apiKey?: string;
  sessionName: string;
}

export interface WAHASession {
  name: string;
  status: string;
  config?: any;
  me?: {
    id: string;
    pushName: string;
  };
}

export interface WAHAMessage {
  session: string;
  chatId: string;
  text?: string;
  media?: {
    url: string;
    mimetype?: string;
    filename?: string;
  };
}

export class WAHAClient {
  private client: AxiosInstance;
  private sessionName: string;

  constructor(config: WAHAConfig) {
    this.sessionName = config.sessionName;

    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (config.apiKey) {
      headers['X-Api-Key'] = config.apiKey;
    }

    this.client = axios.create({
      baseURL: config.apiUrl,
      headers,
      timeout: 10000, // Reduzido de 30s para 10s
    });
  }

  /**
   * Verifica status da sessão
   */
  async getSessionStatus(): Promise<WAHASession> {
    const response = await this.client.get(`/api/sessions/${this.sessionName}`);
    return response.data;
  }

  /**
   * Inicia uma nova sessão
   */
  async startSession(config?: any): Promise<WAHASession> {
    const response = await this.client.post('/api/sessions', {
      name: this.sessionName,
      config: config || {},
    });
    return response.data;
  }

  /**
   * Para a sessão
   */
  async stopSession(): Promise<void> {
    await this.client.delete(`/api/sessions/${this.sessionName}`);
  }

  /**
   * Obtém QR Code para autenticação (via screenshot)
   */
  async getQRCode(): Promise<string> {
    try {
      // Tenta primeiro o endpoint /api/screenshot (mais novo)
      const response = await this.client.get(`/api/screenshot`, {
        params: {
          session: this.sessionName,
        },
        responseType: 'arraybuffer',
      });

      // Converter para base64
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    } catch (error: any) {
      // Fallback para o endpoint antigo /api/sessions/{session}/auth/qr
      if (error.response?.status === 404) {
        try {
          const response = await this.client.get(`/api/sessions/${this.sessionName}/auth/qr`, {
            responseType: 'text',
          });
          return response.data;
        } catch (fallbackError) {
          throw fallbackError;
        }
      }
      throw error;
    }
  }

  /**
   * Envia mensagem de texto
   */
  async sendText(chatId: string, text: string): Promise<any> {
    const response = await this.client.post(`/api/sendText`, {
      session: this.sessionName,
      chatId,
      text,
    });
    return response.data;
  }

  /**
   * Envia arquivo/mídia
   */
  async sendFile(chatId: string, fileUrl: string, caption?: string): Promise<any> {
    const response = await this.client.post(`/api/sendFile`, {
      session: this.sessionName,
      chatId,
      file: {
        url: fileUrl,
      },
      caption,
    });
    return response.data;
  }

  /**
   * Envia imagem
   */
  async sendImage(chatId: string, imageUrl: string, caption?: string): Promise<any> {
    const response = await this.client.post(`/api/sendImage`, {
      session: this.sessionName,
      chatId,
      file: {
        url: imageUrl,
      },
      caption,
    });
    return response.data;
  }

  /**
   * Lista chats
   */
  async getChats(): Promise<any[]> {
    const response = await this.client.get(`/api/${this.sessionName}/chats`);
    return response.data;
  }

  /**
   * Lista contatos
   */
  async getContacts(): Promise<any[]> {
    const response = await this.client.get(`/api/contacts`, {
      params: {
        session: this.sessionName,
      },
    });
    return response.data;
  }

  /**
   * Obtém informações da sessão (número conectado)
   */
  async getMe(): Promise<any> {
    const response = await this.client.get(`/api/${this.sessionName}/me`);
    return response.data;
  }

  /**
   * Configura webhook
   */
  async setWebhook(webhookUrl: string, events?: string[]): Promise<void> {
    await this.client.post(`/api/sessions/${this.sessionName}/webhook`, {
      url: webhookUrl,
      events: events || [
        'message',
        'message.any',
        'state.change',
        'group.join',
        'group.leave',
      ],
    });
  }

  /**
   * Verifica saúde da API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Lista todas as sessões
   */
  async getAllSessions(): Promise<WAHASession[]> {
    const response = await this.client.get('/api/sessions');
    return response.data;
  }

  /**
   * Reinicia sessão
   */
  async restartSession(): Promise<void> {
    await this.client.post(`/api/sessions/${this.sessionName}/restart`);
  }

  /**
   * Desconecta (logout) da sessão
   */
  async logout(): Promise<void> {
    await this.client.post(`/api/sessions/${this.sessionName}/logout`);
  }
}

/**
 * Cria cliente WAHA a partir das configurações do banco
 */
export function createWAHAClient(apiUrl: string, sessionName: string, apiKey?: string): WAHAClient {
  return new WAHAClient({
    apiUrl,
    apiKey,
    sessionName,
  });
}
