"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require('debug')('epic.Provider.pg');
class QueryBuilder {
    constructor(opts) {
        this.opts = opts;
        if (this.opts.columns && this.opts.primaryKeys)
            this.primaryKeys = this.columnTransform(this.opts.primaryKeys);
        else
            this.primaryKeys = this.opts.primaryKeys || ['id'];
    }
    columnTransform(properties) {
        if (!this.opts.columns)
            return properties;
        return properties.map(e => this.opts.columns && this.opts.columns[e] || e);
    }
    spread(docs) {
        if (!docs)
            return {};
        (this.opts.primaryKeys || this.primaryKeys).forEach(e => Reflect.has(docs, e) && !docs[e] && delete docs[e]);
        const { skip, take, ...q } = docs;
        return { columns: this.columnTransform(Object.keys(q)), values: Object.values(q), skip, take };
    }
    find(q) {
        if (!q)
            return `SELECT * FROM ${this.opts.table} LIMIT 1;`;
        const parts = this.spread(q);
        if (parts.columns && parts.columns.length)
            return {
                text: `SELECT * FROM "${this.opts.table}" WHERE ${parts.columns.map((e, i) => `"${e}"=$${i + 1}`).join(' AND ')} LIMIT 1 ${parts.skip && ' OFFSET ' + parts.skip || ''};`,
                values: parts.values
            };
        return `SELECT * FROM "${this.opts.table}" LIMIT 1`;
    }
    query(q) {
        if (!q)
            return `SELECT * FROM ${this.opts.table};`;
        const parts = this.spread(q);
        return {
            text: `SELECT * FROM ${this.opts.table} WHERE ${parts.columns && parts.columns.map((e, i) => `"${e}"=$${i + 1}`).join(' AND ')}${parts.take && ' LIMIT ' + parts.take || ''}${parts.skip && ' OFFSET ' + parts.skip || ''};`,
            values: parts.values
        };
    }
    insert(docs) {
        const parts = this.spread(docs);
        return {
            text: `INSERT INTO "${this.opts.table}" (${parts.columns && parts.columns.map((e) => `"${e}"`).join(',')}) VALUES (${parts.columns && parts.columns.map((e, i) => `$${i + 1}`).join(',')}) RETURNING "${this.primaryKeys[0]}";`,
            values: parts.values
        };
    }
    update(q, docs) {
        if (!docs)
            [q, docs] = [docs, q];
        const filter = this.spread(q), parts = this.spread(docs);
        let i = 1;
        return {
            text: `UPDATE "${this.opts.table}" SET ${parts.columns && parts.columns.map(e => `"${e}"=$${i++}`).join(',')}${filter.columns && filter.columns.length && ' WHERE ' + filter.columns.map(e => `"${e}"=$${i++}`).join(',') || ''};`,
            values: parts.values && parts.values.concat(filter.values) || filter.values
        };
    }
    del(q) {
        const parts = this.spread(q);
        return {
            text: `DELETE FROM "${this.opts.table}"${parts.columns && parts.columns.length && ' WHERE ' + parts.columns.map((e, i) => `"${e}"=$${++i}`).join(' AND ') || ''};`,
            values: parts.values
        };
    }
}
class PGProvider {
    constructor(pool, opts) {
        this.pool = pool;
        this.opts = opts || {};
        this.opts.table = this.opts.table || this.constructor.name.replace('Provider', '');
        this.builder = new QueryBuilder(this.opts);
    }
    async execute(query, ...values) {
        const client = await this.pool.connect();
        try {
            if (!values || !values.length || typeof (query) === 'object')
                return await client.query(query);
            return await client.query(query, values);
        }
        finally {
            client.release();
        }
    }
    async find(q) {
        const command = this.builder.find(q);
        debug('find: %o', command);
        return new QueryResult(await this.execute(command)).single();
    }
    async query(q) {
        const command = this.builder.query(q);
        debug('query: %o', command);
        return new QueryResult(await this.execute(command)).multi();
    }
    async insert(docs) {
        const command = this.builder.insert(docs);
        debug('insert: %o', command);
        return new QueryResult(await this.execute(command)).single()[this.builder.primaryKeys[0]] || 0;
    }
    async update(q, docs) {
        const command = this.builder.update(q, docs);
        debug('update: %o', command);
        return await this.execute(command);
    }
    async upsert(q) {
        return null;
    }
    async delete(q) {
        const command = this.builder.del(q);
        debug('del: %o', command);
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