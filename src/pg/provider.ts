// [postgresql ref](https://node-postgres.com)
const debug = require('debug')('epic.provider.pg')

import { Pool, QueryConfig, QueryResult as PGQueryResult } from 'pg'
import { IProviderOptions, IQueryData, IProvider } from '../common';
import { PGQueryBuilder } from './querybuilder';


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
	async execute(query: string | QueryConfig, ...values: any[]) : Promise<PGQueryResult> {
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

	single<K = T>() : K {
		if (!this.has()) return null as unknown as K
		return this.data.rows[0] as K
	}

	multi<K = T>() : K[] {
		if (!this.has()) return new Array<K>()
		return this.data.rows as K[]
	}

	next() {
	}

	result () {
		return this.data
	}
}

