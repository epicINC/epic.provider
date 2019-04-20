"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require('debug')('epic.provider.pg');
const query_1 = require("./query");
__export(require("./query"));
const orderChecker = /\s(asc|desc)$/i;
class PGQueryBuilder {
    constructor(opts) {
        this.builder = new query_1.QueryBuilder(opts);
        this.opts = opts;
        this.primaryKeys = this.builder.primaryKeys.map(e => this.columnTransform(e));
    }
    columnTransform(name) {
        if (!this.opts.columns)
            return name;
        return this.opts.columns && this.opts.columns[name] || name;
    }
    buildOrderItem(data) {
        if (!Array.isArray(data))
            return orderChecker.test(data) ? data : `"${this.columnTransform(data)}"`;
        return `"${this.columnTransform(data[0])} ${data[1]}"`;
    }
    buildQuery(query) {
        return {
            text: `SELECT * FROM ${this.opts.table}
			WHERE ${query.where.columns && query.where.columns.map((e, i) => `"${this.columnTransform(e)}"=$${i + 1}`).join(' AND ')}
			${query.order && ` ORDER BY ${query.order.map(e => this.buildOrderItem(e)).join(',')}` || ''}
			${query.take && ' LIMIT ' + query.take || ''}
			${query.skip && ' OFFSET ' + query.skip || ''};`,
            values: query.where.values
        };
    }
    find(filter) {
        if (!filter)
            return `SELECT * FROM ${this.opts.table};`;
        let query = this.builder.query(filter);
        query.take = 1;
        return this.buildQuery(this.builder.query(filter));
    }
    query(filter) {
        if (!filter)
            return `SELECT * FROM ${this.opts.table};`;
        return this.buildQuery(this.builder.query(filter));
    }
    insert(data) {
        let query = this.builder.insert(data);
        return {
            text: `
INSERT INTO "${this.opts.table}" (${query.columns && query.columns.map((e) => `"${e}"`).join(',')}) VALUES (${query.columns && query.columns.map((e, i) => `$${i + 1}`).join(',')})
RETURNING "${this.primaryKeys[0]}";`,
            values: query.values
        };
    }
    update(filter, data) {
        if (!data)
            [filter, data] = [{}, filter];
        let query = this.builder.update(filter, data);
        let i = 1;
        return {
            text: `UPDATE "${this.opts.table}" SET 
${query.data.columns && query.data.columns.map(e => `"${this.columnTransform(e)}"=$${i++}`).join(',')}
${query.filter.columns && query.filter.columns.length && ' WHERE ' + query.filter.columns.map(e => `"${this.columnTransform(e)}"=$${i++}`).join(',') || ''};`,
            values: query.data.values && query.data.values.concat(query.filter.values) || query.filter.values
        };
    }
    delete(filter) {
        let query = this.builder.delete(filter);
        return {
            text: `DELETE FROM "${this.opts.table}"${query.columns && query.columns.length && ' WHERE ' + query.columns.map((e, i) => `"${this.columnTransform(e)}"=$${++i}`).join(' AND ') || ''};`,
            values: query.values
        };
    }
}
class PGProvider {
    constructor(pool, opts) {
        this.pool = pool;
        this.opts = opts || {};
        this.opts.table = this.opts.table || this.constructor.name.replace('Provider', '');
        this.builder = new PGQueryBuilder(this.opts);
    }
    async execute(query, ...values) {
        const client = await this.pool.connect();
        try {
            debug('execute: %o, %o', query, values);
            if (!values || !values.length || typeof (query) === 'object')
                return await client.query(query);
            return await client.query(query, values);
        }
        finally {
            client.release();
        }
    }
    async find(filter) {
        const command = this.builder.find(filter);
        return new QueryResult(await this.execute(command)).single();
    }
    async query(filter) {
        const command = this.builder.query(filter);
        return new QueryResult(await this.execute(command)).multi();
    }
    async insert(data) {
        const command = this.builder.insert(data);
        return new QueryResult(await this.execute(command)).single()[this.builder.primaryKeys[0]] || 0;
    }
    async update(filter, data) {
        const command = this.builder.update(filter, data);
        return await this.execute(command);
    }
    async upsert(q) {
        return null;
    }
    async delete(filter) {
        const command = this.builder.delete(filter);
        return await this.execute(command);
    }
}
exports.PGProvider = PGProvider;
class QueryResult {
    constructor(data) {
        this.data = data;
    }
    has() {
        return !!(this.data.rows && this.data.rowCount);
    }
    single() {
        if (!this.has())
            return null;
        return this.data.rows[0];
    }
    multi() {
        if (!this.has())
            return new Array();
        return this.data.rows;
    }
    result() {
        return this.data;
    }
}
exports.QueryResult = QueryResult;
//# sourceMappingURL=pgProvider.js.map