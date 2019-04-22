import { Pool } from 'pg'
import { PGProvider as Provider, parse, IWhereFilter } from '../src/index'

interface IUser {
  id: number
  name: string
  createTime: Date
}


/*
{property: value}
{property: value[]}
*/
function test1 () {
  let query: IWhereFilter<IUser> = {id:[1,2,3], createTime: new Date()}
}

/*
{property: {op:value}}
*/
function test2 () {
  let query: IWhereFilter<IUser> = {id: {$or: [1,2,3], }, createTime: {$and: new Date()}}
}

/*
{op: {property:value}}
{op: [{property:value}]}
*/
function test3 () {
  let query: IWhereFilter<IUser> = {$or: {id: [1,2,3]}, $and: {createTime: new Date()}}
}

/*
{op: [{op: [{property:value}]}]}
*/
function test4() {
  let query: IWhereFilter<IUser> = {$or: [{$and: {id:1}, $ilike: [{id:1, createTime: new Date()}]}]}
}



/*-
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $regexp: Op.regexp,
  $notRegexp: Op.notRegexp,
  $iRegexp: Op.iRegexp,
  $notIRegexp: Op.notIRegexp,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $overlap: Op.overlap,
  $contains: Op.contains,
  $contained: Op.contained,
  $adjacent: Op.adjacent,
  $strictLeft: Op.strictLeft,
  $strictRight: Op.strictRight,
  $noExtendRight: Op.noExtendRight,
  $noExtendLeft: Op.noExtendLeft,
  $and: Op.and,
  $or: Op.or,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col
+

[Op.and]: {a: 5}           // AND (a = 5)
[Op.or]: [{a: 5}, {a: 6}]  // (a = 5 OR a = 6)
[Op.gt]: 6,                // > 6
[Op.gte]: 6,               // >= 6
[Op.lt]: 10,               // < 10
[Op.lte]: 10,              // <= 10
[Op.ne]: 20,               // != 20
[Op.eq]: 3,                // = 3
[Op.not]: true,            // IS NOT TRUE
[Op.between]: [6, 10],     // BETWEEN 6 AND 10
[Op.notBetween]: [11, 15], // NOT BETWEEN 11 AND 15
[Op.in]: [1, 2],           // IN [1, 2]
[Op.notIn]: [1, 2],        // NOT IN [1, 2]
[Op.like]: '%hat',         // LIKE '%hat'
[Op.notLike]: '%hat'       // NOT LIKE '%hat'
[Op.iLike]: '%hat'         // ILIKE '%hat' (case insensitive) (PG only)
[Op.notILike]: '%hat'      // NOT ILIKE '%hat'  (PG only)
[Op.startsWith]: 'hat'     // LIKE 'hat%'
[Op.endsWith]: 'hat'       // LIKE '%hat'
[Op.substring]: 'hat'      // LIKE '%hat%'
[Op.regexp]: '^[h|a|t]'    // REGEXP/~ '^[h|a|t]' (MySQL/PG only)
[Op.notRegexp]: '^[h|a|t]' // NOT REGEXP/!~ '^[h|a|t]' (MySQL/PG only)
[Op.iRegexp]: '^[h|a|t]'    // ~* '^[h|a|t]' (PG only)
[Op.notIRegexp]: '^[h|a|t]' // !~* '^[h|a|t]' (PG only)
[Op.like]: { [Op.any]: ['cat', 'hat']}
                       // LIKE ANY ARRAY['cat', 'hat'] - also works for iLike and notLike
[Op.overlap]: [1, 2]       // && [1, 2] (PG array overlap operator)
[Op.contains]: [1, 2]      // @> [1, 2] (PG array contains operator)
[Op.contained]: [1, 2]     // <@ [1, 2] (PG array contained by operator)
[Op.any]: [2,3]            // ANY ARRAY[2, 3]::INTEGER (PG only)

[Op.col]: 'user.organization_id' // = "user"."organization_id", with dialect specific column identifiers, PG in this example
*/


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