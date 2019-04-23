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
    find<K extends T>(filter: Partial<K> | Partial<IQueryData<K>>): IQueryBuilderResult;
    query<K extends T>(filter: Partial<K> | Partial<IQueryData<K>>): IQueryBuilderResult;
    insert<K extends T>(data: Partial<K>): {
        columns: string[];
        values: string[];
    };
    private removePrimaryKeys;
    update<K extends T>(filter: Partial<K> | Partial<IQueryData<K>>, data: Partial<K>): {
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
export declare type IFieldsFilter<T> = {
    [P in keyof T]?: boolean;
} | keyof T | [keyof T][];
export declare type IIncludeFilter = {
    [key: string]: string | string[];
} | string | string[];
declare const Operators: {
    '=': string;
    '$eq': string;
    '$and': string;
    '$or': string;
    '$gt': string;
    '$gte': string;
    '$lt': string;
    '$lte': string;
    '$between': string;
    '$inq': string;
    '$nin': string;
    '$near': string;
    '$neq': string;
    '$like': string;
    '$nlike': string;
    '$ilike': string;
    '$nilike': string;
    '$regexp': string;
};
export declare type IWhereFilter<T> = IPropertyFilter<T> | IPropertyOperatorFilter<T> | IOperatorPropertyFilter<T> | IOperatorFilter<T>;
export declare type IPropertyFilter<T> = {
    [P in keyof T]?: T[P] | T[P][];
};
export declare type IPropertyOperatorFilter<T> = {
    [P in keyof T]?: {
        [O in keyof typeof Operators]?: T[P] | T[P][];
    };
};
export declare type IOperatorPropertyFilter<T> = {
    [O in keyof typeof Operators]?: IPropertyFilter<T> | IPropertyFilter<T>[];
};
export declare type IOperatorFilter<T> = {
    [O in keyof typeof Operators]?: IOperatorPropertyFilter<T>[];
};
export declare type IOrderFilter<T> = string | keyof T | [keyof T] | [keyof T, 'asc' | 'desc'][];
export interface IQueryData<T = any> {
    fields: IFieldsFilter<T>;
    include: IIncludeFilter;
    where: IWhereFilter<T>;
    order: IOrderFilter<T>;
    skip: number;
    take: number;
}
export {};
