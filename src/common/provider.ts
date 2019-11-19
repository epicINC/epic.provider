import { IQueryData } from './query'

export interface IProviderOptions {
	table?: string
	columns?: {[key: string]: string}
	primaryKeys?: string[]
}

export interface IProvider<T> {
	find<K extends T>(filter: Partial<K> | Partial<IQueryData>) : Promise<K | null>
	query<K extends T>(filter: Partial<K> | Partial<IQueryData>) : Promise<K[]>
	insert<K extends T>(data: Partial<K>) : Promise<any>
	update<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K>) : Promise<any>
	upsert<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K>) : Promise<any>
	delete<K extends T>(filter: Partial<K>) : Promise<any>
}
