// [postgresql ref](https://node-postgres.com)
const debug = require('debug')('epic.provider.pg')

import { Pool, QueryConfig, QueryResult as PGQueryResult } from 'pg'
import { QueryBuilder, IProviderOptions, IQueryData, IQueryBuilderResult } from './query';

export * from './query'


/*
class columnBuilder {
	constructor(opts: IProviderOptions) {

	}

	to () {
		
	}
}
*/

const orderChecker = /\s(asc|desc)$/i

class PGQueryBuilder<T = any> {
	builder: QueryBuilder
	private opts: IProviderOptions

	primaryKeys: string[]

	constructor(opts: IProviderOptions) {
		this.builder = new QueryBuilder(opts)
		this.opts = opts
		this.primaryKeys = this.builder.primaryKeys.map(e => this.columnTransform(e))
	}

	columnTransform(name: string) {
		if (!this.opts.columns) return name
		return this.opts.columns && this.opts.columns[name] || name
	}

	buildOrderItem(data: string | [string, 'asc'|'desc']) {
		if (!Array.isArray(data)) return orderChecker.test(data) ? data : `"${this.columnTransform(data)}"`
		return `"${this.columnTransform(data[0])} ${data[1]}"`
	}

	private buildQuery(query: IQueryBuilderResult) {
		return {
			text: `SELECT * FROM ${this.opts.table}
			WHERE ${query.where.columns && query.where.columns.map((e:any, i: number) => `"${this.columnTransform(e)}"=$${i+1}`).join(' AND ') }
			${query.order && ` ORDER BY ${ query.order.map(e => this.buildOrderItem(e)).join(',') }` || ''}
			${query.take && ' LIMIT '+ query.take || ''}
			${ query.skip && ' OFFSET '+ query.skip || '' };`,
			values: query.where.values
		}
	}

	find<K extends T>(filter: Partial<K> | Partial<IQueryData>) : QueryConfig | string {
		if (!filter) return `SELECT * FROM ${this.opts.table};`
		let query = this.builder.query(filter)
		query.take = 1
		return this.buildQuery(this.builder.query(filter))
	}

	query<K extends T>(filter: Partial<K> | Partial<IQueryData>) : QueryConfig | string {
		if (!filter) return `SELECT * FROM ${this.opts.table};`
		return this.buildQuery(this.builder.query(filter))
	}

	insert<K extends T>(data: Partial<K>): QueryConfig {
		let query = this.builder.insert(data)

		return {
			text: `
INSERT INTO "${this.opts.table}" (${query.columns && query.columns.map((e: any) => `"${e}"`).join(',')}) VALUES (${query.columns && query.columns.map((e, i) => `$${i+1}`).join(',')})
RETURNING "${this.primaryKeys[0]}";`,
			values: query.values
		}
	}

	update<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K>) {
		if (!data) [filter, data] = [{}, <Partial<K>>filter]
		let query = this.builder.update(filter, data)

		let i = 1
		return {
			text: `UPDATE "${this.opts.table}" SET 
${query.data.columns && query.data.columns.map(e => `"${this.columnTransform(e)}"=$${i++}`).join(',')}
${query.filter.columns && query.filter.columns.length && ' WHERE '+ query.filter.columns.map(e => `"${this.columnTransform(e)}"=$${i++}`).join(',')  || '' };`,

			values: query.data.values && query.data.values.concat(query.filter.values) || query.filter.values
		}
	}

	delete<K extends T>(filter: Partial<K>) {
		let query = this.builder.delete(filter)

		return {
			text: `DELETE FROM "${this.opts.table}"${query.columns && query.columns.length && ' WHERE '+ query.columns.map((e, i) => `"${this.columnTransform(e)}"=$${++i}`).join(' AND ') || '' };`,
			values: query.values
		}
	}
}


export interface IProvider<T> {
	find<K extends T>(filter: Partial<K> | Partial<IQueryData>): Promise<K>
	query<K extends T>(filter: Partial<K> | Partial<IQueryData>): Promise<K[]>
	insert<K extends T>(data: Partial<K>): Promise<any>
	update<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K>): Promise<any>
	upsert<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K>): Promise<any>
	delete<K extends T>(filter: Partial<K>): Promise<any>
}



export class PGProvider<T = any> implements IProvider<T> {

	pool: Pool
	opts: IProviderOptions
	builder: PGQueryBuilder<T>

	constructor(pool: Pool, opts: IProviderOptions) {
		this.pool = pool
		this.opts = opts || {}
		this.opts.table = this.opts.table || this.constructor.name.replace('Provider', '')

		this.builder = new PGQueryBuilder<T>(this.opts)
	}

	/*
	protected result(action: 'find' | 'query', ret: QueryResult) {
		if (!ret) return null

		if (action === 'find') return ret.rows && ret.rows[0] as T
		if (action === 'query') return ret.rows as T[]

		return null
	}
*/
	async execute(query: string | QueryConfig, ...values: any[]): Promise<PGQueryResult> {
		const client = await this.pool.connect()
		try {
			debug('execute: %o, %o', query, values)
			if (!values || !values.length || typeof(query) === 'object')
				return await client.query(query)
			return await client.query(query, values)
		} finally {
			client.release()
		}
	}

	async find<K extends T>(filter: Partial<K> | Partial<IQueryData>) {
		const command = this.builder.find(filter)
		return new QueryResult<K>(await this.execute(command)).single<K>()
	}

	async query<K extends T>(filter: Partial<K> | Partial<IQueryData>) {
		const command = this.builder.query(filter)
		return new QueryResult<K>(await this.execute(command)).multi()
	}

	async insert<K extends T>(data: Partial<K>) {
		const command = this.builder.insert(data)
		return new QueryResult(await this.execute(command)).single()[this.builder.primaryKeys[0]] || 0
	}

	async update<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K>) {
		const command = this.builder.update(filter, data)
		return await this.execute(command)
	}

	async upsert(q: Partial<T>) {
		return null
	}

	async delete<K extends T>(filter: Partial<K>) {
		const command = this.builder.delete(filter)
		return await this.execute(command)
	}

}


export class QueryResult<T = any> {

	data: PGQueryResult

	constructor(data: PGQueryResult) {
		this.data = data
	}

	has() {
		return !!(this.data.rows && this.data.rowCount)
	}

	single<K>() : K {
		if (!this.has()) return null as unknown as K
		return this.data.rows[0] as K
	}

	multi<K = T>() {
		if (!this.has()) return new Array<K>()
		return this.data.rows as K[]
	}

	result () {
		return this.data
	}
}

