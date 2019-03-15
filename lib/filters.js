
const util = require('util')


class FilterBase {
	constructor(opts) {
		this.opts = opts
	}

	transform(fields) {
		if (Array.isArray(fields)) return fields.map(e => this.transform(e))
		if (typeof(fields) === 'object') {
			let ret = {}
			Object.entries(([name, val]) => ret[this.transform(name)] = typeof(val) === 'object' ? this.transform(val) : val)
			return ret
		}
		return this.opts[fields] || fields
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
