import { QueryConfig } from 'pg'
import { IQueryBuilderResult, IQueryData, IProviderOptions } from '../common'
import { QueryBuilderBase } from '../common/querybuilder'





const orderChecker = /\s(asc|desc)$/i

export class PGQueryBuilder<T = any> {
	builder: QueryBuilderBase
	private opts: IProviderOptions

	primaryKeys: string[]

	constructor (opts: IProviderOptions) {
		this.builder = new QueryBuilderBase(opts)
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

	protected buildLimit (take: number) {
		if (!take || isNaN(take)) return ''
		return `LIMIT ${take}`
	}

	protected buildOffset (skip: number) {
		if (!skip || isNaN(skip)) return ''
		return `OFFSET ${skip}`
	}

	protected buildQuery(query: IQueryBuilderResult) {
		return {
			text: `SELECT * FROM ${this.opts.table}
			WHERE ${query.where.columns && query.where.columns.map((e: any, i: number) => `"${this.columnTransform(e)}"=$${i + 1}`).join(' AND ') }
			${query.order && ` ORDER BY ${ query.order.map(e => this.buildOrderItem(e)).join(',') }` || ''}
			${this.buildLimit(query.take)}
			${this.buildOffset(query.skip)};`,
			values: query.where.values
		}
	}

	find<K extends T>(filter: Partial<K> | Partial<IQueryData<K>>) : QueryConfig | string {
		if (!filter) return `SELECT * FROM ${this.opts.table};`
		let query = this.builder.query(filter)
		query.take = 1
		return this.buildQuery(this.builder.query(filter))
	}

	query<K extends T>(filter: Partial<K> | Partial<IQueryData>) : QueryConfig | string {
		if (!filter) return `SELECT * FROM ${this.opts.table};`
		return this.buildQuery(this.builder.query(filter))
	}

	insert<K extends T>(data: Partial<K>) : QueryConfig {
		let query = this.builder.insert(data)

		return {
			text: `
INSERT INTO "${this.opts.table}" (${query.columns && query.columns.map((e: any) => `"${e}"`).join(',')}) VALUES (${query.columns && query.columns.map((e, i) => `$${i + 1}`).join(',')})
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
${query.filter.columns && query.filter.columns.length && ' WHERE '+ query.filter.columns.map(e => `"${this.columnTransform(e)}"=$${ i++ }`).join(',')  || '' };`,

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
