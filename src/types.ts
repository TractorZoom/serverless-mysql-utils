export type RowData = {
    [name: string]: any;
};

export type QueryInfo = { affectedRows?: number; insertId?: number };

export type QueryResponse<T> = Promise<{ data?: T; error?: string }>;
export type TransactionResponse = Promise<{ data: (RowData[] | QueryInfo)[]; error?: string }>;
