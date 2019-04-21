import { IWhereFilter } from '../src/query'


interface IUser {
	id: string
	name: string
	categoryID: number
	createTime: Date
}



let where : IWhereFilter<IUser>