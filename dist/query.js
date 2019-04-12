"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QueryBuilder {
    constructor(opts) {
        this.opts = opts;
        if (this.opts.columns && this.opts.primaryKeys)
            this.primaryKeys = this.opts.primaryKeys;
        else
            this.primaryKeys = this.opts.primaryKeys || ['id'];
    }
    buildWhere(data) {
        if (!data)
            return { columns: [], values: [] };
        return {
            columns: Object.keys(data),
            values: Object.values(data)
        };
    }
    buildOrder(data) {
        if (!data)
            return undefined;
        if (!Array.isArray(data))
            return [data];
        return data;
    }
    buildSkip(data) {
        if (!data)
            return 0;
        return data;
    }
    buildTake(data) {
        if (!data)
            return 0;
        return data;
    }
    find(filter) {
        const result = this.query(filter);
        result.take = 1;
        return result;
    }
    query(filter) {
        if (!isQuery(filter))
            filter = { where: filter };
        let result = {};
        result.where = this.buildWhere(filter.where);
        result.order = this.buildOrder(filter.order);
        result.skip = this.buildSkip(filter.skip);
        result.take = this.buildTake(filter.take);
        return result;
    }
    insert(data) {
        return this.removePrimaryKeys(this.buildWhere(data));
    }
    removePrimaryKeys(filter) {
        if (!filter.columns.length)
            return filter;
        const index = filter.columns.indexOf(this.primaryKeys[0]);
        if (index === -1)
            return filter;
        filter.columns.splice(index, 1);
        filter.values.splice(index, 1);
        return filter;
    }
    update(filter, data) {
        return {
            filter: this.buildWhere(filter),
            data: this.removePrimaryKeys(this.buildWhere(data))
        };
    }
    delete(filter) {
        return this.buildWhere(filter);
    }
}
exports.QueryBuilder = QueryBuilder;
function isQuery(data) {
    return data.fields !== undefined ||
        data.include !== undefined ||
        data.where !== undefined ||
        data.order !== undefined ||
        data.skip !== undefined ||
        data.take !== undefined;
}
//# sourceMappingURL=query.js.map