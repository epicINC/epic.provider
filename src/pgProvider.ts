// [postgresql ref](https://node-postgres.com)
const debug = require('debug')('epic.Provider.pg')

import { Pool, QueryConfig, QueryResult as PGQueryResult } from 'pg'

interface IQueryResult {
	skip?: number
	take?: number
	columns: string[]
	values: any[]
}

export interface IPagedParam {
	skip?: number
	take?: number
}

export type IQueryParam<T> = IPagedParam & Partial<T>


/*
class columnBuilder {
	constructor(opts: IProviderOptions) {

	}

	to () {
		
	}
}
*/


class QueryBuilder {
	private opts: IProviderOptions

	primaryKeys: string[]

	constructor(opts: IProviderOptions) {
		this.opts = opts

		if (this.opts.columns && this.opts.primaryKeys) 
			this.primaryKeys = this.columnTransform(this.opts.primaryKeys)
		else
			this.primaryKeys = this.opts.primaryKeys || ['id']
	}

	columnTransform(properties: string[]) {
		if (!this.opts.columns) return properties
		return properties.map(e => this.opts.columns && this.opts.columns[e] || e)
	}

	spread(docs: any): Partial<IQueryResult> {
		if (!docs) return {};
		(this.opts.primaryKeys || this.primaryKeys).forEach(e => Reflect.has(docs, e) && !docs[e] && delete docs[e])
		const { skip, take, ...q} = docs
		return { columns: this.columnTransform(Object.keys(q)), values: Object.values(q), skip, take}
	}

	find<T>(q: Partial<T>) : QueryConfig | string {
		if (!q) return `SELECT * FROM ${this.opts.table} LIMIT 1;`
		const parts = this.spread(q)
		if (parts.columns && parts.columns.length)
			return {
				text: `SELECT * FROM "${this.opts.table}" WHERE ${ parts.columns.map((e, i) => `"${e}"=$${i+1}`).join(' AND ') } LIMIT 1 ${ parts.skip && ' OFFSET '+ parts.skip || '' };`,
				values: parts.values
			}
		return `SELECT * FROM "${this.opts.table}" LIMIT 1`
	}

	query<T>(q: Partial<T> | IQueryParam<T>): QueryConfig | string {
		if (!q) return `SELECT * FROM ${this.opts.table};`
		const parts = this.spread(q)
		return {
			text: `SELECT * FROM ${this.opts.table} WHERE ${parts.columns && parts.columns.map((e:any, i: number) => `"${e}"=$${i+1}`).join(' AND ') }${parts.take && ' LIMIT '+ parts.take || ''}${ parts.skip && ' OFFSET '+ parts.skip || '' };`,
			values: parts.values
		}
	}

	insert<T>(docs: T): QueryConfig {
		const parts = this.spread(docs)
		return {
			text: `INSERT INTO "${this.opts.table}" (${parts.columns && parts.columns.map((e: any) => `"${e}"`).join(',')}) VALUES (${parts.columns && parts.columns.map((e, i) => `$${i+1}`).join(',')}) RETURNING "${this.primaryKeys[0]}";`,
			values: parts.values
		}
	}

	update<T>(q: Partial<T>, docs: Partial<T>) {
		if (!docs) [q, docs] = [docs, q]

		const filter = this.spread(q), parts = this.spread(docs)

		let i = 1
		return {
			text: `UPDATE "${this.opts.table}" SET ${parts.columns && parts.columns.map(e => `"${e}"=$${i++}`).join(',')}${filter.columns && filter.columns.length && ' WHERE '+ filter.columns.map(e => `"${e}"=$${i++}`).join(',')  || '' };`,
			values: parts.values && parts.values.concat(filter.values) || filter.values
		}
	}

	del<T>(q: Partial<T>) {
		const parts = this.spread(q)
		return {
			text: `DELETE FROM "${this.opts.table}"${parts.columns && parts.columns.length && ' WHERE '+ parts.columns.map((e, i) => `"${e}"=$${++i}`).join(' AND ') || '' };`,
			values: parts.values
		}
	}
}

export interface IProviderOptions {
	table?: string
	columns?:{[key:string]: string},
	primaryKeys?: string[]
}


export interface IProvider<T> {
	find<K extends T = T>(filter: Partial<K>): Promise<K>
	query<K extends T = T>(filter: IQueryParam<K>): Promise<K[]>
	insert(doc: T): Promise<any>
	update(filter: Partial<T>, doc: object): Promise<any>
	upsert(filter: Partial<T>, doc: object): Promise<any>
	delete(filter: Partial<T>): Promise<any>
}



export class PGProvider<T = any> implements IProvider<T> {

	pool: Pool
	opts: IProviderOptions
	builder: QueryBuilder

	constructor(pool: Pool, opts: IProviderOptions) {
		this.pool = pool
		this.opts = opts || {}
		this.opts.table = this.opts.table || this.constructor.name.replace('Provider', '')

		this.builder = new QueryBuilder(this.opts)
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
			if (!values || !values.length || typeof(query) === 'object')
				return await client.query(query)
			return await client.query(query, values)
		} finally {
			client.release()
		}
	}

	async find<K extends T = T>(q: Partial<K>) {
		const command = this.builder.find(q)
		debug('find: %o', command)
		return new QueryResult<K>(await this.execute(command)).single()
	}

	async query<K extends T = T>(q: IQueryParam<K>) {
		const command = this.builder.query(q)
		debug('query: %o', command)
		return new QueryResult<K>(await this.execute(command)).multi()
	}

	async insert(docs: Partial<T>) {
		const command = this.builder.insert(docs)
		//command.text += 'return select lastval() as insert_id;'
		debug('insert: %o', command)
		return new QueryResult(await this.execute(command)).single()[this.builder.primaryKeys[0]] || 0
	}

	async update(q: Partial<T>, docs: Partial<T>) {
		const command = this.builder.update(q, docs)
		debug('update: %o', command)
		return await this.execute(command)
	}

	async upsert(q: Partial<T>) {
		return null
	}

	async delete(q: Partial<T>) {
		const command = this.builder.del(q)
		debug('del: %o', command)
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

	single<K = T>() : K {
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

