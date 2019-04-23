

export interface IQueryBuilderResult {
	where: {columns: string[], values: any[]}
	order: ([string, 'asc'|'desc'] | string)[]
	skip: number
	take: number
}


export type IFieldsFilter<T> = {
	[P in keyof T]?: boolean
} | keyof T | [keyof T][]

export type IIncludeFilter = {
	[key: string]: string | string[]
} | string | string[]


/*
const GEOUnitType = {
	kilometers,
	meters,
	miles,
	feet,
	radians,
	degrees
}
*/

export const Operators = {
	'=': '=',
	'$eq': '=',
	'$and': 'AND',
	'$or': 'OR',
	'$gt': '>',
	'$gte': '>=',
	'$lt': '<',
	'$lte': '<=',
	'$between': 'BETWEEN IN ($1, $2)' ,
	'$inq': 'IN ($1)',
	'$nin': 'NOT IN ($1)',

	// WHERE ST_DWithin(A.geom, B.geom, 1609.34) ORDER BY A.geom <-> B.geom
	// maxDistance location
	'$near': '<->',
	'$neq': '!=',
	'$like': 'LIKE',
	'$nlike': 'NOT LIKE',
	'$ilike': 'LIKE',
	'$nilike': 'NOT LIKE',
	// regexp_match(string text, pattern text [, flags text])
	'$regexp': 'regexp_match($1, $2)'
}



export type IWhereFilter<T> = IPropertyFilter<T> | IPropertyOperatorFilter<T> | IOperatorPropertyFilter<T> | IOperatorFilter<T>

/*
{property: value | value[]}
{property: value[]}
*/
export type IPropertyFilter<T> = {
	[P in keyof T]?: T[P] | T[P][]
}

/*
{property: {op: value | value[] }}
*/
export type IPropertyOperatorFilter<T> = {
	[P in keyof T]?: { [O in keyof typeof Operators]?: T[P] | T[P][] }
}


/*
{op: {property:value}}
{op: [{property:value}]}
*/
export type IOperatorPropertyFilter<T> = {
	[O in keyof typeof Operators]?: IPropertyFilter<T> | IPropertyFilter<T>[]
}


/*
{op: [{op: [{property:value}]}]}
*/
export type IOperatorFilter<T> = {
	[O in keyof typeof Operators]?: IOperatorPropertyFilter<T>[]
}



export type IOrderFilter<T> = string | keyof T | [keyof T] | [keyof T, 'asc'|'desc'][]


export interface IQueryData<T = any> {
	fields: IFieldsFilter<T>
	include: IIncludeFilter
	where: IWhereFilter<T>
	order: IOrderFilter<T>
	skip: number
	take: number
}



