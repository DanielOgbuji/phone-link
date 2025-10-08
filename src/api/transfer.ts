// API service functions for mobile file transfer
import axios, { AxiosResponse } from 'axios';

export interface ValidateCodeRequest {
  code: string;
}

export interface ValidateCodeResponse {
  sessionId: string;
  wsUrl: string;
  expiresAt: string;
  token?: string;
}

export interface TransferSessionStatus {
  status: "waiting" | "connected" | "transferring" | "completed" | "expired" | "cancelled";
  wsUrl?: string;
  expiresAt: string;
  token?: string;
}

export interface GenerateCodeResponse {
  sessionId: string;
  code: string;
  qrCode: string;
  expiresAt: string;
}

// Base API URL - adjust as needed
const API_BASE_URL = import.meta.env.VITE_API_BASE;

// Create axios instance with default headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

// Validate transfer code
export const validateCode = async (code: string, token?: string): Promise<ValidateCodeResponse> => {
  try {
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response: AxiosResponse<ValidateCodeResponse> = await apiClient.post(
      '/transfer/validate-code',
      { code },
      { headers }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error('Invalid code format.');
    } else if (error.response?.status === 404) {
      throw new Error('Code expired or invalid — ask sender for a new one.');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your bearer token.');
    } else {
      throw new Error('Failed to validate code. Please try again.');
    }
  }
};

// Get transfer session status
export const getTransferSessionStatus = async (sessionId: string, token?: string): Promise<TransferSessionStatus> => {
  try {
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response: AxiosResponse<TransferSessionStatus> = await apiClient.get(
      `/transfer/sessions/${sessionId}`,
      { headers }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your bearer token.');
    } else {
      throw new Error('Failed to get session status.');
    }
  }
};

// Generate new code (for desktop side)
export const generateCode = async (token?: string): Promise<GenerateCodeResponse> => {
  try {
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response: AxiosResponse<GenerateCodeResponse> = await apiClient.post(
      '/transfer/generate-code',
      {},
      { headers }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your bearer token.');
    } else {
      throw new Error('Failed to generate code.');
    }
  }
};

// Cancel transfer session
export const cancelTransferSession = async (sessionId: string, token?: string): Promise<void> => {
  try {
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await apiClient.patch(
      `/transfer/sessions/${sessionId}/cancel`,
      {},
      { headers }
    );
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your bearer token.');
    } else {
      throw new Error('Failed to cancel session.');
    }
  }
};
