
let makeSureString = value => {
	if (!value) value = ''
	if (typeof value !== 'string') value = ''
	return value
}

let verifyRequired = (value, rule) => {
	if (!rule.allowSpace) {
		value = value.replace(/^\s+|\s+$/g, '')
	}
	if (rule.required) {
		if (!value) {
			return false
		}
	}
	return true
}

let verifyMinLen = (value, rule) => {
	if (rule.minLen) {
		if (value.length < rule.minLen) {
			return false
		}
	}
	return true
}

let verifyMaxLen = (value, rule) => {
	if (rule.maxLen) {
		if (value.length > rule.maxLen) {
			return false
		}
	}
	return true
}

let verifyRegex = (value, rule) => {
	return rule.regex.test(value)
}

let verifyIsEmail = (value, rule) => {
	if (!value) return true
	return /^[^@]+@[a-z0-9_-]+(\.[a-z0-9_-]+)*(\.[a-z]{2,}){1,2}$/.test(value)
}

let verifyByRule = async (value, rule) => {
	value = makeSureString(value)
	// console.log('[input_verify.js - verifyByRule] ', value, rule)

	// { required: true, message: '', allowSpace: false }
	if (rule.required) {
		return verifyRequired(value, rule)
	}

	// minLen
	if (rule.minLen) {
		return verifyMinLen(value, rule)
	}
	// maxLen
	if (rule.maxLen) {
		return verifyMaxLen(value, rule)
	}

	// regex
	// { regex: /\d+/, message: '请输入正确的 Email 地址' }
	if (rule.regex) {
		return verifyRegex(value, rule)
	}
	// isEmail
	// { isEmail: true, message: '请输入正确的 Email 地址' }
	if (rule.isEmail) {
		return verifyIsEmail(value, rule)
	}

	// 这个放在最后
	/* 例子
	{ validator (value, rule) { // 也可用 async
		return new Promise((resolve, reject) => {
			resolve(true) // 记得要返回 true
		})
	}, message: 'xyz1' }, */
	if (rule.validator) {
		return await rule.validator(value, rule)
	}
	return true
}

/**
 * 根据规则验证输入的值
 *
 * @param {String} value 要验证的值
 * @param {Object|Array} rule 验证规则。可以是单个规则对象，也可以是多条规则对象的数组。
 * @returns undefined 表示验证通过
 *          Object 表示验证失败，返回的是 rule 对象（可以知道是哪条规则没通过）
 */
let verify = async function (value, rule) {
	let result = true
	if (Array.isArray(rule)) {
		for (let i = 0; i < rule.length; i++) {
			let oneRule = rule[i];
			result = await verifyByRule(value, oneRule)
			if (!result) return oneRule // false 则返回
		}
	} else {
		result = await verifyByRule(value, rule)
		if (!result) return rule
	}
}

export {
	verify
}
