import { ApiPayload, ApiResponse } from '../types';

/**
 * Sends a POST request to the Google Apps Script Web App.
 * Uses text/plain Content-Type to avoid CORS preflight issues inherent to GAS.
 */
export const callAPI = async (url: string, payload: ApiPayload): Promise<ApiResponse> => {
    try {
        const response = await fetch(url, {
            method: "POST",
            // IMPORTANT: strict text/plain to avoid CORS preflight options request
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const result: ApiResponse = await response.json();
        return result;
    } catch (error: any) {
        console.error("API Error Detail:", error);
        throw new Error("Gagal terhubung ke server. " + (error.message || "Unknown error"));
    }
};