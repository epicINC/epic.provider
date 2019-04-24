import { Operators, IWhereFilter } from './query'


const OperatorMap = new Set(Object.keys(Operators))

export abstract class Expression {

	nodeType: ExpressionType

	constructor () {
	}

	accept(visitor: ExpressionVisitor) {
		return visitor.visitExtension(this)
	}


	visitChildren (visitor: ExpressionVisitor) {
		return visitor.visit(this.ReduceAndCheck())
	}

	ReduceAndCheck () {
		return this.Reduce()
	}

	Reduce () {
		return this
	}



	static makeBinary (binaryType: ExpressionType, left: Expression, right: Expression) {
		return new SimpleBinaryExpression(ExpressionType.Add, left, right)
	}

	static makeParameter(name: string) {
		return new ParameterExpression(name)
	}

	static reduce(nodeType: ExpressionType, nodes: Expression[]) {
		return nodes.reduce((accumulator, currentValue) => Expression.makeBinary(nodeType, accumulator, currentValue))
	}

}

export class ExpressionBuilder {

	static build(data: any) {
		if (Array.isArray(data)) return data.map(e => ExpressionBuilder.build(e))
		if (typeof(data) !== 'object') return data

		Object.entries(data).map(([key, val]) => {
			if (OperatorMap.has(key)) return this[key](val)
			return Expression.makeBinary(ExpressionType.Equal, Expression.makeParameter(key), ExpressionBuilder.build(val))
		})

	}

	eql (data: any) {
		let result = ExpressionBuilder.build(data)
		if (!Array.isArray(result)) return result
		return Expression.reduce(ExpressionType.Equal, result)
	}

	and (data: any) {
		let result = ExpressionBuilder.build(data)
		if (!Array.isArray(result)®) return result
		return Expression.reduce(ExpressionType.And, result)
	}
}

export class ExpressionVisitor {

	visit(data: any) {

	}

	visitExtension (node: Expression) {
		return node.visitChildren(this)
	}

}

class BinaryExpression extends Expression  {
	readonly left: Expression
	readonly right: Expression


	constructor (left: Expression, right: Expression) {
		super()
		this.left = left
		this.right = right
	}

	static make (nodeType: ExpressionType, left: Expression, right: Expression) {
		return new SimpleBinaryExpression(nodeType, left, right)
	}
}

class SimpleBinaryExpression extends BinaryExpression {
	constructor (nodeType: ExpressionType, left: Expression, right: Expression) {
		super(left, right)
		this.nodeType = nodeType
	}
}

class ParameterExpression extends Expression {

	name: string

	constructor (name: string) {
		super()

		this.nodeType = ExpressionType.Parameter
		this.name = name
	}

}

enum ExpressionType {
	Add,
	AddChecked,
	And,
	AndAlso,
	ArrayLength,
	ArrayIndex,
	Call,
	Coalesce,
	Conditional,
	Constant,
	Convert,
	ConvertChecked,
	Divide,
	Equal,
	ExclusiveOr,
	GreaterThan,
	GreaterThanOrEqual,
	Invoke,
	Lambda,
	LeftShift,
	LessThan,
	LessThanOrEqual,
	ListInit,
	MemberAccess,
	MemberInit,
	Modulo,
	Multiply,
	MultiplyChecked,
	Negate,
	UnaryPlus,
	NegateChecked,
	New,
	NewArrayInit,
	NewArrayBounds,
	Not,
	NotEqual,
	Or,
	OrElse,
	Parameter,
	Power,
	Quote,
	RightShift,
	Subtract,
	SubtractChecked,
	TypeAs,
	TypeIs,
	Assign,
	Block,
	DebugInfo,
	Decrement,
	Dynamic,
	Default,
	Extension,
	Goto,
	Increment,
	Index,
	Label,
	RuntimeVariables,
	Loop,
	Switch,
	Throw,
	Try,
	Unbox,
	AddAssign,
	AndAssign,
	DivideAssign,
	ExclusiveOrAssign,
	LeftShiftAssign,
	ModuloAssign,
	MultiplyAssign,
	OrAssign,
	PowerAssign,
	RightShiftAssign,
	SubtractAssign,
	AddAssignChecked,
	MultiplyAssignChecked,
	SubtractAssignChecked,
	PreIncrementAssign,
	PreDecrementAssign,
	PostIncrementAssign,
	PostDecrementAssign,
	TypeEqual,
	OnesComplement,
	IsTrue,
	IsFalse
}
