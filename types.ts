export interface User {
    nama: string;
    role: string;
    [key: string]: any;
}

export interface ApiResponse {
    status: 'success' | 'error';
    message?: string;
    nama?: string;
    role?: string;
    [key: string]: any;
}

export interface ApiPayload {
    action: string;
    [key: string]: any;
}

export interface LoginCredentials {
    id: string;
    pass: string;
}