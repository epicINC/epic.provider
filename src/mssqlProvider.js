
const util = require('util')

// https://loopback.io/doc/en/lb3/Querying-data.html

class ObjectAnalyzer {



}

class Util {

	static toObject(array, protoFn, valFn) {
		let ret = {}
		array.forEach((e, i) => ret[protoFn && protoFn(e, i) || e] = valFn && valFn(e, i) || null)
		return ret
	}

	static addRange(array, data) {
		return Array.isArray(data) ? array.push(...data) : array.push(data)
	}


	static mapMany(array, fn) {
		const ret = []
		array.forEach((e, i, context) => Util.addRange(ret, fn(e, i, context)))
		return ret
	}
}



const OrderExp = /^\s*([\w]+|\[[\w\-\.\s]+\]+)(\s+(asc|desc))?\s*$/i

class FieldsFilter {
	constructor(opts) {
		this.opts = opts
	}

	/*
	ie1:{id: true, name: false}
	ie2: ['id', 'name']
	*/
	transform(fields) {
		if (Array.isArray(fields)) return Util.toObject(fields, e => this.opts.columns[e], () => true)

		const includes = [], excludes = []
		Object.entries(([key, val]) => (val ? includes : excludes).push(this.opts.columns[key] || key))
		if (includes.length) return this.transform(includes)

		return Util.toObject(excludes, e => this.opts.columns[e], () => false)
	}
}


class OrderFilter {

	constructor(opts) {
		this.opts = opts
	}
	/*
	ie1: 'id desc'
	ie2: 'id, name desc'
	ie2: ['id', 'name desc']
	*/
	transform(order) {
		if (Array.isArray(order)) return Util.mapMany(order, e => this.transform(e))
		if (order.includes(',')) return order.split(',').map(e => this.transform(e))
		return order.replace(OrderExp, (match, p1, p2, p3, offset, string) => `${(this.opts.columns[p1] || p1)}${p3 && ` ${p3}` || '' }`)
	}

}

class LimitFilter {
	transform(limit) {
		return limit
	}
}

class SkipFilter {
	transform(skip) {
		return skip
	}
}


const Operators = new Set(['=', 'and', 'or', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'inq', 'nin', 'near', 'neq', 'like', 'nlike', 'ilike', 'nilike', 'regexp'])
const OperatorsMap = {
	'=': '%s=@%s',
	'gt': '%s>@%s',
	'gte': '%s>=@%s',
	'lt': '%s>@%s',
	'lte': '%s<=%s',
	'between': '%s BETWEEN (@%s AND @%s)',
	'in': '%s IN (%s)',
	'inq': '%s IN (%s)',
	'nin': '%s NOT IN (%s)',
	'near': '',
	'neq': '%s!=@%s',
	'like': '%s LIKE CONCAT(\'\', @%s)',
	'nlike': '%s NOT LIKE CONCAT(\'\', @%s)',
	'ilike': '',
	'nilike': '',
	'regexp': '',
}

class WhereFilter {

	constructor(opts) {
		this.opts = opts
	}

	transform(where) {
		this.command = {filter: '', parameters: [], fields: []};
		this.command.filter = this.iteration(where)
		return this.command
	}


		//  {and: [{title: 'My Post'}, {content: 'Hello'}]}
	iteration(root, key, val) {
		if (arguments.length === 1) [root, key, val] = [val, 'AND', root]

		function join(items, op) {
			if (items.length > 1) return `(${items.join(` ${op} `)})`
			return `${items.join(` ${op} `)}`
		}

		function batch(command, items, el, op) {
				const offset = command.parameters.length
				command.parameters.push(...items)
				return util.format(OperatorsMap[op], el, items.map((e, i) => `@${offset + i}`).join(','))
		}

// https://docs.microsoft.com/zh-cn/sql/t-sql/language-elements/between-transact-sql?view=sql-server-ver15
		switch(key) {
			case 'and':
			case 'or':
			case 'neq':
				if (Array.isArray(val)) return join(val.map(e => this.iteration(null, null, e)), key.toUpperCase())
				if (typeof(val) === 'object') return join(Object.entries(val).map(([name, data]) => this.iteration(key, name, data)), 'AND')
				this.command.parameters.push(val)
				return util.format(OperatorsMap[key], key, this.command.parameters.length - 1)
			case 'gt':
			case 'gte':
			case 'lt':
			case 'lte':
				this.command.parameters.push(val)
				return util.format(OperatorsMap[key], root, this.command.parameters.length - 1)
			case 'like':
			case 'nlike':
				if (Array.isArray(val)) return join(val.map(e => this.iteration(null, null, e)), key.toUpperCase())
				if (typeof(val) === 'object') return join(Object.entries(val).map(([name, data]) => this.iteration(key, name, data)), 'AND')
				this.command.parameters.push(val)
				return util.format(OperatorsMap[key], root, this.command.parameters.length - 1)
			case 'in':
			case 'inq':
			case 'nin':
				return batch(this.command, val, root, key)
			case 'between':
				this.command.parameters.push(val[0])
				this.command.parameters.push(val[1])
				return util.format(OperatorsMap[key], root, this.command.parameters.length -2, this.command.parameters.length - 1)

			default:
				if (typeof(val) === 'object') return join(Object.entries(val).map(([name, data]) => this.iteration(key, name, data)), 'AND')
					this.command.parameters.push(val)
				if (root === 'neq')
					return util.format(OperatorsMap['neq'], key, this.command.parameters.length - 1)

				return util.format(OperatorsMap['='], key, this.command.parameters.length - 1)
		}



	}
}



const Filters = {
order: OrderFilter,
where: WhereFilter
}

/*

opts: {table: '', columns: {'id': 'ID'}}

const Filters = {
fields: FieldsFilter,
include: IncludeFilter,
limit: LimitFilter,
order: OrderFilter,
skip: SkipFilter,
where: WhereFilter,
}


*/
class QueryBuilder {


	constructor (opts) {
		this.opts = opts
		this.filters = {}
		this.filterNames = Object.keys(Filters)

		this.filterNames.forEach(name => this.filters[name] = new Filters[name](opts))



	}

	columnTransform(properties) {
		return properties.map(e => this.opts.columns && this.opts.columns[e] || e)
	}




	spread(docs) {
		if (!docs || !Object.keys(docs).length) return {}

		if (!docs.hasOwnProperty('where')) docs = {where: docs}

		this.filterNames.forEach(name => {
			if (!docs.hasOwnProperty(name)) return
			docs[name] = this.filters[name].transform(docs[name])
		})

		return docs
	}

	get (q) {
		if (!q) return `SELECT TOP 1 * FROM ${this.opts.table};`
		const parts = this.spread(q)
		return {
			text: `SELECT TOP 1 ${ parts.fields && parts.fields.join(',') || '*' } FROM ${this.opts.table} WHERE ${ parts.where.filter } ${ parts.skip && ' OFFSET '+ parts.skip || '' };`,
			values: parts.where.parameters
		}
	}

	find(q) {
		if (!q) return `SELECT TOP 1 * FROM ${this.opts.table};`
		const parts = this.spread(q)

	}

} 


/*

select * from Orders order by orderid OFFSET (1) ROW FETCH NEXT 15 rows only

	const pool = new ConnectionPool({
    user: 'sa',
    password: 'iKe6pAWw',
    server: '192.168.1.153',
    database: 'test'
	})
 */

const {ConnectionPool, Request} = require('mssql')

class Provder {

	constructor(pool, opts) {
		this.pool = pool
		this.opts = opts || {}
		this.opts.table = this.opts.table || this.constructor.name.trimEnd('Provder')

		this.builder = new QueryBuilder(this.opts)	}


	async SCHEMA() {
		this.schema = {primaryKeys: [], keys: {}, columns: {}}
		const ret = await this.execute(
			`exec sp_helpIndex '${this.opts.schema || 'dbo'}.${this.opts.table}';
			SELECT COLUMN_NAME,DATA_TYPE,CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='${this.opts.table}' AND TABLE_SCHEMA = '${this.opts.schema || 'dbo'}';`
		)
		if (!ret) return this.schema = null

		ret.recordsets[1].forEach(e => this.schema.columns[e.COLUMN_NAME] = {type: e.DATA_TYPE, length: e.CHARACTER_MAXIMUM_LENGTH})
		ret.recordsets[0].forEach(e => {
			this.schema.keys[e.index_name] = { type:'ix', columns: e.index_keys.split(',').map(e => e.trimStart()) }
			if (!e.index_description.includes('primary key')) return
			this.schema.keys[e.index_name].type = 'pk'
			this.schema.primaryKeys = this.schema.keys[e.index_name].columns
		})
		return this.schema
	}

	async execute(text, inputValues, outputValues) {
		if (!this.schema) await this.SCHEMA()
		const method = /select\s|update\s|insert\s|delete\s|execute\s|exec\s/i.test(text) ? 'query' : 'execute'

		try {
			if (!inputValues && !outputValues) return await (await this.pool).request()[method](text)

			const request = (await this.pool).request()
			if (inputValues && inputValues.length)
				inputValues.forEach((e, i) => request.input(`${i}`, e))

			if (outputValues && outputValues.length)
				outputValues.forEach((e, i) => request.output(`out${i}`))

			return await request[method](text)
		} catch(err) {
			console.error(`MSSQL ${method} error: %s`, err);
		}
	}

	async get(q) {
		const command = this.builder.get(q)
		console.log(command);
		return await this.execute(command.text, command.values)
	}

}




(async () => {

	const pool = new ConnectionPool({
    user: 'sa',
    password: 'iKe6pAWw',
    server: '192.168.1.153',
    database: 'Northwind'
	}).connect()

	const provider = new Provder(pool, {table: 'Orders', columns: {id: 'OrderID'}})

	const ret = await provider.get({OrderID: 10248})
	console.log(ret)


})()

