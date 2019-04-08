import { Pool, QueryConfig, QueryResult as PGQueryResult } from 'pg';
import { QueryBuilder, IProviderOptions, IQueryData } from './query';
export * from './query';
declare class PGQueryBuilder<T = any> {
    builder: QueryBuilder;
    private opts;
    primaryKeys: string[];
    constructor(opts: IProviderOptions);
    columnTransform(name: string): string;
    buildOrderItem(data: string | [string, 'asc' | 'desc']): string;
    private buildQuery;
    find<K extends T>(filter: Partial<K> | Partial<IQueryData>): QueryConfig | string;
    query<K extends T>(filter: Partial<K> | Partial<IQueryData>): QueryConfig | string;
    insert<K extends T>(data: Partial<K>): QueryConfig;
    update<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K>): {
        text: string;
        values: any[];
    };
    delete<K extends T>(filter: Partial<K>): {
        text: string;
        values: any[];
    };
}
export interface IProvider<T> {
    find<K extends T>(filter: Partial<K> | Partial<IQueryData>): Promise<K>;
    query<K extends T>(filter: Partial<K> | Partial<IQueryData>): Promise<K[]>;
    insert<K extends T>(data: Partial<K>): Promise<any>;
    update<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K>): Promise<any>;
    upsert<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K>): Promise<any>;
    delete<K extends T>(filter: Partial<K>): Promise<any>;
}
export declare class PGProvider<T = any> implements IProvider<T> {
    pool: Pool;
    opts: IProviderOptions;
    builder: PGQueryBuilder<T>;
    constructor(pool: Pool, opts: IProviderOptions);
    execute(query: string | QueryConfig, ...values: any[]): Promise<PGQueryResult>;
    find<K extends T>(filter: Partial<K> | Partial<IQueryData>): Promise<K>;
    query<K extends T>(filter: Partial<K> | Partial<IQueryData>): Promise<K[]>;
    insert<K extends T>(data: Partial<K>): Promise<any>;
    update<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K>): Promise<PGQueryResult>;
    upsert(q: Partial<T>): Promise<null>;
    delete<K extends T>(filter: Partial<K>): Promise<PGQueryResult>;
}
export declare class QueryResult<T = any> {
    data: PGQueryResult;
    constructor(data: PGQueryResult);
    has(): boolean;
    single<K>(): K;
    multi<K = T>(): K[];
    result(): PGQueryResult;
}
