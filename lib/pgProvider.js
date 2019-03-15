// [postgresql ref](https://node-postgres.com)
const debug = require('debug')('east.Provider.pg')


class QueryBuilder {
	constructor (opts) {
		this.opts = opts
	}

	columnTransform(properties) {
		return properties.map(e => this.opts.columns && this.opts.columns[e] || e)
	}

	spread(docs) {
		if (!docs) return {}
		const {skip, offset, ...q} = docs

		return { columns: this.columnTransform(Object.keys(q)), values: Object.values(q), skip, offset}
	}

	get (q) {
		if (!q) return `SELECT * FROM ${this.opts.table} LIMIT 1;`
		const parts = this.spread(q)
		if (parts.columns.length)
			return {
				text: `SELECT * FROM "${this.opts.table}" WHERE ${ parts.columns.map((e, i) => `"${e}"=$${i+1}`).join(' AND ') } LIMIT 1 ${ parts.skip && ' OFFSET '+ parts.skip || '' };`,
				values: parts.values
			}
		return `SELECT * FROM "${this.opts.table}" LIMIT 1`
	}

	find (q) {
		if (!q) return `SELECT * FROM ${this.opts.table};`
		const parts = this.spread(q)
		return {
			text: `SELECT * FROM ${this.opts.table} WHERE ${ parts.columns.map((e, i) => `"${e}"=$${i+1}`).join(' AND ') }${parts.take && ' LIMIT '+ parts.take || ''}${ parts.skip && ' OFFSET '+ parts.skip || '' };`,
			values: parts.values
		}
	}

	insert(docs) {
		if (Array.isArray(docs)) return docs.map(e => this.insert(e))

		const parts = this.spread(docs)
		return {
			text: `INSERT INTO "${this.opts.table}" (${parts.columns.map(e => `"${e}"`).join(',')}) VALUES (${parts.columns.map((e, i) => `$${i+1}`).join(',')})`,
			values: parts.values
		}
	}

	update (q, docs) {
		if (!docs) [q, docs] = [docs, q]

		const filter = this.spread(q), parts = this.spread(docs)

		let i = 1
		return {
			text: `UPDATE "${this.opts.table}" SET ${ parts.columns.map(e => `"${e}"=$${i++}`).join(',') }${ filter.columns.length && ' WHERE '+ filter.columns.map(e => `"${e}"=$${i++}`).join(',')  || '' };`,
			values: parts.values.concat(filter.values)
		}
	}

	del(q) {
		const parts = this.spread(q)
		return {
			text: `DELETE FROM "${this.opts.table}"${ parts.columns.length && ' WHERE '+ parts.columns.map((e, i) => `"${e}"=$${++i}`).join(' AND ') || '' };`,
			values: parts.values
		}
	}
}

function result(action, ret) {
	if (!ret) return undefined
		
	if (action === 'get') return ret.rows && ret.rows[0]
}


class Provder {

	// opts: {table: '', columns: {'id': 'ID'}}
	constructor (pool, opts) {
		this.pool = pool
		this.opts = opts || {}
		this.opts.table = this.opts.table || this.constructor.name.trimEnd('Provder')

		this.builder = new QueryBuilder(this.opts)
	}

	async execute(query, ...values) {

		const client = await this.pool.connect()
		try {
			if (Array.isArray(query)) return await Promise.all(query.map(e => client.query(e)))

			if (!values || !values.length || typeof(query) === 'object')
				return await client.query(query)
			return await client.query(query, values)
		} finally {
			client.release()
		}
	}


	async get(q) {
		const command = this.builder.get(q)
		debug('get: %o', command)
		return result('get', await this.execute(command))
	}

	async find(q) {
		const command = this.builder.find(q)
		debug('find: %o', command)
		return await this.execute(command)
	}

	async insert(docs) {
		const command = this.builder.insert(docs)
		debug('insert: %o', command)
		return await this.execute(command)
	}

	async update(q, docs) {
		const command = this.builder.update(q, docs)
		debug('update: %o', command)
		return await this.execute(command)
	}

	async del(q) {
		const command = this.builder.del(q)
		debug('del: %o', command)
		return await this.execute(command)
	}

}


module.exports = Provder