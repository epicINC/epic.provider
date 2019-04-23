import { IProviderOptions, IQueryData, IWhereFilter, IOrderFilter, IQueryBuilderResult } from '.'

export class QueryBuilderBase<T = any> {

	private opts: IProviderOptions
	primaryKeys: string[]

	constructor (opts: IProviderOptions) {
		this.opts = opts

		if (this.opts.columns && this.opts.primaryKeys)
			this.primaryKeys = this.opts.primaryKeys
		else
			this.primaryKeys = this.opts.primaryKeys || ['id']
	}

	private buildWhere<K> (data: IWhereFilter<K>) {
		if (!data) return {columns: [],  values: []}
		return {
			columns: Object.keys(data),
			values: Object.values(data)
		}
	}

	private buildOrder<K> (data: IOrderFilter<K>) : ([string, 'asc'|'desc'] | string)[] {
		if (!data) return undefined as unknown as ([string, 'asc'|'desc'] | string)[]
		if (!Array.isArray(data)) return [data] as ([string, 'asc'|'desc'] | string)[]
		return data as ([string, 'asc'|'desc'] | string)[]
	}

/*
	private buildFields (result: IQueryBuilderResult, data: string | string[] | IFieldsFilter) {

	}
*/

	private buildSkip(data: number | undefined) {
		if (!data) return 0
		return data
	}

	private buildTake(data: number | undefined) {
		if (!data) return 0
		return data
	}

	find<K extends T> (filter: Partial<K> | Partial<IQueryData<K>>) {
		const result = this.query(filter)
		result.take = 1
		return result
	}

	query<K extends T> (filter: Partial<K> | Partial<IQueryData<K>>) {
		if (!isQuery(filter)) filter = {where: filter}

		let result: IQueryBuilderResult = {} as IQueryBuilderResult
		result.where = this.buildWhere(filter.where as IWhereFilter<K>)
		result.order = this.buildOrder(filter.order as IOrderFilter<K>)
		result.skip = this.buildSkip(filter.skip)
		result.take = this.buildTake(filter.take)
		return result
	}

	insert<K extends T>(data: Partial<K>) {
		return this.removePrimaryKeys(this.buildWhere(data))
	}

	private removePrimaryKeys(filter: {columns: string[], values: string[]}) {
		if (!filter.columns.length) return filter
		const index = filter.columns.indexOf(this.primaryKeys[0])
		if (index === -1) return filter
		filter.columns.splice(index, 1)
		filter.values.splice(index, 1)

		return filter
	}

	update<K extends T>(filter: Partial<K> | Partial<IQueryData<K>>, data: Partial<K>) {
		if (!isQuery(filter)) filter = {where: filter}
		return {
			filter: this.buildWhere(filter.where as IWhereFilter<K>),
			data: this.removePrimaryKeys(this.buildWhere(data))
		}
	}

	delete<K extends T>(filter: Partial<K>) {
		return this.buildWhere(filter)
	}

}

function isQuery<T>(data: Partial<T> | Partial<IQueryData<T>>) : data is Partial<IQueryData<T>> {
	return (<IQueryData>data).where !== undefined ||
	(<IQueryData>data).fields !== undefined ||
	(<IQueryData>data).order !== undefined ||
	(<IQueryData>data).skip !== undefined ||
	(<IQueryData>data).take !== undefined ||
	(<IQueryData>data).include !== undefined
}