"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QueryBuilder {
    buildWhere(data) {
        if (!data)
            return undefined;
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
        result.take = this.buildTake(filter.skip);
        return result;
    }
    insert(data) {
        return this.buildWhere(data);
    }
    update(filter, data) {
        return {
            filter: this.buildWhere(filter),
            data: this.buildWhere(filter)
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