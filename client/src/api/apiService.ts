const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ClientApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Có lỗi xảy ra');
    }

    return data;
  }

  async login(phone: string, accessCode: string) {
    return this.request<{
      success: boolean;
      data: {
        name: string;
        phone: string;
        accessCode: string;
        email: string;
        property: string;
        roomCode: string;
        roomId?: number;
      };
    }>('/client/login', {
      method: 'POST',
      body: JSON.stringify({ phone, accessCode }),
    });
  }

  async getLease(phone: string, accessCode: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>('/client/lease', {
      method: 'POST',
      body: JSON.stringify({ phone, accessCode }),
    });
  }

  async payBill(phone: string, accessCode: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        roomId: number;
        payment: any;
      };
    }>('/client/pay', {
      method: 'POST',
      body: JSON.stringify({ phone, accessCode }),
    });
  }

  async healthCheck() {
    return this.request<{ status: string; mongodb: string }>('/health');
  }
}

export const clientApiService = new ClientApiService();
export default clientApiService;
