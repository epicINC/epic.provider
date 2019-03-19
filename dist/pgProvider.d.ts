import { Pool, QueryConfig, QueryResult } from 'pg';
interface IQueryResult {
    skip?: number;
    take?: number;
    columns: string[];
    values: any[];
}
declare class QueryBuilder {
    opts: IProviderOptions;
    constructor(opts: IProviderOptions);
    columnTransform(properties: string[]): string[];
    spread(docs: any): Partial<IQueryResult>;
    find<T>(q: Partial<T>): QueryConfig | string;
    query<T>(q: Partial<T>): QueryConfig | string;
    insert<T>(docs: T): QueryConfig;
    update<T>(q: Partial<T>, docs: Partial<T>): {
        text: string;
        values: any[] | undefined;
    };
    del<T>(q: Partial<T>): {
        text: string;
        values: any[] | undefined;
    };
}
export interface IProviderOptions {
    table?: string;
    columns?: {
        [key: string]: string;
    };
}
export interface IProvider<T> {
    find(filter: Partial<T>): Promise<T | null>;
    query(filter: Partial<T>): Promise<T[] | null>;
    insert(doc: T): Promise<any>;
    update(filter: Partial<T>, doc: object): Promise<any>;
    upsert(filter: Partial<T>, doc: object): Promise<any>;
    delete(filter: Partial<T>): Promise<any>;
}
export declare const ProviderResult: unique symbol;
export declare class PGProvider<T = any> implements IProvider<T> {
    pool: Pool;
    opts: IProviderOptions;
    builder: QueryBuilder;
    constructor(pool: Pool, opts: IProviderOptions);
    [ProviderResult](action: 'find' | 'query', ret: QueryResult): T | T[] | null;
    execute(query: string | QueryConfig, ...values: any[]): Promise<QueryResult>;
    find(q: Partial<T>): Promise<T>;
    query(q: Partial<T>): Promise<T[]>;
    insert(docs: Partial<T>): Promise<QueryResult>;
    update(q: Partial<T>, docs: Partial<T>): Promise<QueryResult>;
    upsert(q: Partial<T>): Promise<null>;
    delete(q: Partial<T>): Promise<QueryResult>;
}
export {};
