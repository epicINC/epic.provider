import { Pool } from 'pg'
import { PGProvider as Provider, parse } from '../src/index'






async function test() {
	const
	connectionStrings = 'postgresql://postgres:TMaketch@192.168.1.153:5432/ticket',
	connectionConfig = parse(connectionStrings),
	pool = new Pool(connectionConfig),
	provider = new Provider(pool, {table: 'rule', columns: {id: 'idX'}, primaryKeys: ['id']})


	let data = {
		id: 0,
		hostID: 1,
		exhID: 1,
		name: `自动生成规则`,
		description: '',
		rules: {
			days: [{start: Date.now(), end: Date.now()}],
			sets: {'default': { in:1, out:1, strict: true } }
		},
		createTime: new Date()
	}

	let result = await provider.insert(data)
	console.log(result)

	let rule = await provider.find({id: result})

	console.log(rule)

}

test()