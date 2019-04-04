import { Pool, QueryConfig, QueryResult as PGQueryResult } from 'pg';
interface IQueryResult {
    skip?: number;
    take?: number;
    columns: string[];
    values: any[];
}
export interface IPagedParam {
    skip?: number;
    take?: number;
}
export declare type IQueryParam<T> = IPagedParam & Partial<T>;
declare class QueryBuilder {
    private opts;
    primaryKeys: string[];
    constructor(opts: IProviderOptions);
    columnTransform(properties: string[]): string[];
    spread(docs: any): Partial<IQueryResult>;
    find<T>(q: Partial<T>): QueryConfig | string;
    query<T>(q: Partial<T> | IQueryParam<T>): QueryConfig | string;
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
    primaryKeys?: string[];
}
export interface IProvider<T> {
    find<K extends T = T>(filter: Partial<K>): Promise<K>;
    query<K extends T = T>(filter: IQueryParam<K>): Promise<K[]>;
    insert(doc: T): Promise<any>;
    update(filter: Partial<T>, doc: object): Promise<any>;
    upsert(filter: Partial<T>, doc: object): Promise<any>;
    delete(filter: Partial<T>): Promise<any>;
}
export declare class PGProvider<T = any> implements IProvider<T> {
    pool: Pool;
    opts: IProviderOptions;
    builder: QueryBuilder;
    constructor(pool: Pool, opts: IProviderOptions);
    execute(query: string | QueryConfig, ...values: any[]): Promise<PGQueryResult>;
    find<K extends T = T>(q: Partial<K>): Promise<K>;
    query<K extends T = T>(q: IQueryParam<K>): Promise<K[]>;
    insert(docs: Partial<T>): Promise<any>;
    update(q: Partial<T>, docs: Partial<T>): Promise<PGQueryResult>;
    upsert(q: Partial<T>): Promise<null>;
    delete(q: Partial<T>): Promise<PGQueryResult>;
}
export declare class QueryResult<T = any> {
    data: PGQueryResult;
    constructor(data: PGQueryResult);
    has(): boolean;
    single<K = T>(): K;
    multi<K = T>(): K[];
    result(): PGQueryResult;
}
export {};
