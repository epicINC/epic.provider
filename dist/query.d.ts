export interface IProviderOptions {
    table?: string;
    columns?: {
        [key: string]: string;
    };
    primaryKeys?: string[];
}
export declare class QueryBuilder<T = any> {
    private opts;
    primaryKeys: string[];
    constructor(opts: IProviderOptions);
    private buildWhere;
    private buildOrder;
    private buildSkip;
    private buildTake;
    find<K extends T>(filter: Partial<K> | Partial<IQueryData>): IQueryBuilderResult;
    query<K extends T>(filter: Partial<K> | Partial<IQueryData>): IQueryBuilderResult;
    insert<K extends T>(data: Partial<K>): {
        columns: string[];
        values: string[];
    };
    private removePrimaryKeys;
    update<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K>): {
        filter: {
            columns: string[];
            values: any[];
        };
        data: {
            columns: string[];
            values: string[];
        };
    };
    delete<K extends T>(filter: Partial<K>): {
        columns: string[];
        values: any[];
    };
}
export interface IQueryBuilderResult {
    where: {
        columns: string[];
        values: any[];
    };
    order: ([string, 'asc' | 'desc'] | string)[];
    skip: number;
    take: number;
}
export interface IFieldsFilter {
    [key: string]: boolean;
}
export interface IIncludeFilter {
    [key: string]: string | string[];
}
export interface IWhereFilter {
    [key: string]: any;
}
export interface IQueryData {
    fields: string | string[] | IFieldsFilter;
    include: string | string[] | IIncludeFilter;
    where: IWhereFilter;
    order: string | string[] | [string, 'asc' | 'desc'][];
    skip: number;
    take: number;
}
