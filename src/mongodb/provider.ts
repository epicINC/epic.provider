// [mongodb ref](http://mongodb.github.io/node-mongodb-native)
// const debug = require('debug')('epic.provider.mongo')

import assert from 'assert'
import URL from 'url'

import { IProviderOptions, IQueryData, IProvider } from '../common'
import { MongoClient, FilterQuery } from 'mongodb'




export class MongoProvider<T = any> implements IProvider<T> {
	
	connectionStrings: string
	databaseName: string
	collectionName: string
	opts: IProviderOptions

	constructor(connectionStrings: string, opts: IProviderOptions) {
		this.connectionStrings = connectionStrings

		this.opts = opts || {}
		const url = URL.parse(this.connectionStrings)
		this.collectionName = this.opts.table || this.constructor.name.replace('Provider', '')

		this.databaseName = url.pathname || ''

		assert(this.connectionStrings)
		assert(this.opts)

	}


	async executeOne<K>(query: {}) : Promise<K | null> {
		let client: MongoClient | null = null
		try {
			client = await MongoClient.connect(this.connectionStrings)
			return await client.db(this.databaseName).collection<K>(this.collectionName).findOne(query)
		} catch (e) {
			console.error(e)
		} finally {
			client && (client.close())
		}
		return null
	}


	async executeMany<K>(query: {}) : Promise<K[]> {
		let client: MongoClient | null = null
		try {
			client = await MongoClient.connect(this.connectionStrings)
			return await client.db(this.databaseName).collection<K>(this.collectionName).find(query).toArray()
		} catch (e) {
			console.error(e)
		} finally {
			client && (client.close())
		}
		return []
	}


	async getCollection<K>() {
		let client: MongoClient | null = null
		return MongoClient.connect(this.connectionStrings)
		.then(e => (client = e).db(this.databaseName).collection<K>(this.collectionName))
		.catch(e => {
			console.error(e)
			return Promise.resolve()
		})
		.finally(() => client && client.close())
	}

	async find<K extends T>(filter: Partial<K> | Partial<IQueryData>) : Promise<K | null> {
		let collection = await this.getCollection<K>()
		if (!collection) return null
		return collection.findOne(filter as FilterQuery<K>)
	}

	async query<K extends T>(filter: Partial<K> | Partial<IQueryData>) : Promise<K[]> {
		let collection = await this.getCollection<K>()
		if (!collection) return []
		return await collection.find(filter as FilterQuery<K>).toArray()

	}

	async insertOne<K extends T>(data: Partial<K>) {
		let collection = await this.getCollection<K>()
		if (!collection) return false
		return await collection.insertOne(data as any)
	}

	async insertMany<K extends T>(data: Partial<K>[]) {
		let collection = await this.getCollection<K>()
		if (!collection) return false
		return await collection.insertMany(data as any)
	}

	async insert<K extends T>(data: Partial<K> | Partial<K>[]) {
		return await (Array.isArray(data) ? this.insertMany(data) : this.insertOne(data))
	}


	async updateOne<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K>) {
		let collection = await this.getCollection<K>()
		if (!collection) return false
		return await collection.updateOne(filter as FilterQuery<K>, data as any)
	}

	async updateMany<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K>[]) {
		let collection = await this.getCollection<K>()
		if (!collection) return false
		return await collection.updateMany(filter as FilterQuery<K>, data as any)
	}

	async update<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K> | Partial<K>[]) {
		return await (Array.isArray(data) ? this.updateMany(filter, data) : this.updateOne(filter, data))
	}

	async upsert<K extends T>(filter: Partial<K> | Partial<IQueryData>, data: Partial<K>) {
		throw new Error('not implement')
	}


	async deleteOne<K extends T>(filter: Partial<K> | Partial<IQueryData>) {
		let collection = await this.getCollection<K>()
		if (!collection) return false
		return await collection.deleteOne(filter as FilterQuery<K>)
	}

	async deleteMany<K extends T>(filter: Partial<K> | Partial<IQueryData>) {
		let collection = await this.getCollection<K>()
		if (!collection) return false
		return await collection.deleteMany(filter as FilterQuery<K>)
	}

	async delete<K extends T>(filter: Partial<K> | Partial<IQueryData>) {
		return await this.deleteMany(filter)
	}

}

