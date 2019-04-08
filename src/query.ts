export interface IProviderOptions {
	table?: string
	columns?:{[key:string]: string},
	primaryKeys?: string[]
}

export class QueryBuilder<T = any> {


	private buildWhere (data: IWhereFilter | undefined) {
		if (!data) return undefined as unknown as {columns: string[], values: any[]}
		return {
			columns: Object.keys(data),
			values: Object.values(data)
		}
	}

	private buildOrder (data: string | ([string, 'asc'|'desc'] | string)[] | undefined) {
		if (!data) return undefined as unknown as ([string, 'asc'|'desc'] | string)[]
		if (!Array.isArray(data)) return [data]
		return data
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

	find<K extends T> (filter: Partial<K> | Partial<IQueryData>) {
		const result = this.query(filter)
		result.take = 1
		return result
	}

	query<K extends T> (filter: Partial<K> | Partial<IQueryData>) {
		if (!isQuery(filter)) filter = {where: filter}

		let result: IQueryBuilderResult = {} as IQueryBuilderResult
		result.where = this.buildWhere(filter.where)
		result.order = this.buildOrder(filter.order)
		result.skip = this.buildSkip(filter.skip)
		result.take = this.buildTake(filter.skip)
		return result
	}

	insert<K extends T>(data: Partial<K>) {
		return this.buildWhere(data)
	}

	update<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K>) {
		 return {
			 filter: this.buildWhere(filter),
			 data: this.buildWhere(filter)
		 }
	}

	delete<K extends T>(filter: Partial<K>) {
		return this.buildWhere(filter)
	}

}




export interface IQueryBuilderResult {
	where: {columns: string[], values: any[]}
	order: ([string, 'asc'|'desc'] | string)[]
	skip: number
	take: number
}

function isQuery(data: any) : data is IQueryData {
	return (<IQueryData>data).fields !== undefined ||
	(<IQueryData>data).include !== undefined ||
	(<IQueryData>data).where !== undefined ||
	(<IQueryData>data).order !== undefined ||
	(<IQueryData>data).skip !== undefined ||
	(<IQueryData>data).take !== undefined
	
}


export interface IFieldsFilter {
	[key: string]: boolean
}

export interface IIncludeFilter {
	[key: string]: string | string[]
}


export interface IWhereFilter {
	[key: string]: any
}


export interface IQueryData {
	fields: string | string[] | IFieldsFilter
	include: string | string[] | IIncludeFilter
	where: IWhereFilter
	order: string | string[] | [string, 'asc'|'desc'][]
	skip: number
	take: number
}