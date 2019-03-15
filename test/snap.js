
const
	url = require('url'),
	{Pool} = require('pg'),
	Provider = require('../lib/pgProvider')
	


const params = url.parse(process.env.DATABASE || 'postgresql://postgres:TMaketch@192.168.1.153:5432/senecatest');
const auth = params.auth.split(':');
 
const config = {
  user: auth[0],
  password: auth[1],
  host: params.hostname,
  port: params.port,
  database: params.pathname.split('/')[1],
  ssl: false
}


class Util {
	static toObject(val, fn) {
		let result = {}
		val.forEach((e, i) => {
			result[e.name] = e
			fn && fn(e, i)
		})
		return result
	}

	static buildSchema ([columns, constraints]) {
		let result = {
			columns: columns.rows.map(e => new FieldInfo(e)),
			keys: constraints.rows.map(e => new ConstraintInfo(e))
		}
		result.columnMap = Util.toObject(result.columns)
		result.keyMap = Util.toObject(result.keys, e => { e.primaryKey && (result.primaryKeys && result.primaryKeys.push(e) || (result.primaryKeys = [e])) })
		return result
	}

}


class SchemaInfo {

	constructor (provider) {
		this.provider = provider
	}

	async get () {
		if (this.schema) return this.schema
		let result = await this.provider.execute(`SELECT * FROM information_schema.columns WHERE table_schema='public' AND table_name='${this.provider.opts.table}';SELECT * FROM information_schema.constraint_column_usage WHERE table_schema='public' AND table_name='${this.provider.opts.table}';`)
		return this.schema = Util.buildSchema(result)
	}

}

class FieldInfo {

	constructor (column) {
		this.table = {catalog: column.table_catalog, schema: column.table_schema, name: column.table_name}
		this.name = column.column_name
		this.ordinal = column.ordinal_position
		this.default = column.column_default
		this.nullable = column.is_nullable
		this.dataType = column.data_type
		this.charMax = column.character_maximum_length
		this.charOctet = column.character_octet_length
		this.numericPrecision = column.numeric_precision
		this.numericPrecisionRadix = column.numeric_precision_radix
		this.numericScale = column.numeric_scale
		this.datetimePrecision = column.datetime_precision
		//this.udt = {catalog: column.udt_catalog, schema: column.udt_schema, name: column.udt_name}
	}

}

class ConstraintInfo {

	constructor (column) {
		this.name = column.column_name
		this.constraint_name = column.constraint_name
		this.primaryKey = column.constraint_name.endsWith('_pkey')
	}

}

async function test() {

	const pool = new Pool(config)
	const provider = new Provider(pool, {table: 'application'})
	const schema = new SchemaInfo(provider)
	const result = await schema.get()
	console.log(result)

}



test().catch(e => console.log(e))