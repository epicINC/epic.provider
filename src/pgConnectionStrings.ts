import * as url from 'url'


export interface IConnectionConfig {
	user: string
	password: string
	host: string
	port: number
	database: string
	ssl: boolean
}

export function parse(data: string) : IConnectionConfig {
	const params = url.parse(data)
	const auth = params.auth && params.auth.split(':')

	return {
		user: auth && auth[0] || 'postgres',
		password: auth && auth[1] || '',
		host: params.hostname || '',
		port: params.port && Number.parseInt(params.port) || 5432,
		database: params.pathname && params.pathname.split('/')[1] || '',
		ssl: params.protocol && params.protocol.endsWith('s') || false
	}
}

export default parse