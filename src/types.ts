export type QueryResponse<T> = Promise<{ data?: T; error?: string }>;
export type TransactionResponse = Promise<{ data?: any[]; error?: string }>;
