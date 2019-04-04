export interface IConnectionConfig {
    user: string;
    password: string;
    host: string;
    port: number;
    database: string;
    ssl: boolean;
}
export declare function parse(data: string): IConnectionConfig;
export default parse;
