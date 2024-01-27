
let setClientId = clientId => {
	window.localStorage.setItem('clientId', clientId)
}

let getClientId = () => {
	return window.localStorage.getItem('clientId')
}

let request = (url, data = {}) => {
	return new Promise((resolve, reject) => {
		let clientId = getClientId()
		let xhr = new XMLHttpRequest()
		xhr.open('POST', import.meta.env.VITE_API_URL + url, true)
		xhr.setRequestHeader('Content-type', 'application/json')
		if (clientId) xhr.setRequestHeader('Client-id', clientId)
		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) { // UNSENT 0, OPENED 1, HEADERS_RECEIVED 2, LOADING 3, DONE 4
				if (xhr.getResponseHeader('client-id')) {
					// getAllResponseHeaders
					setClientId(xhr.getResponseHeader('client-id'))
				}
				if (xhr.status === 200) {
					try {
						let ret = JSON.parse(xhr.responseText)
						if (ret.error) {
							reject(new Error(ret.error))
						} else {
							resolve(ret)
						}
					} catch (e) {
						reject(new Error(e.message))
					}
				} else {
					reject(new Error(xhr.responseText))
				}
			}
		}
		xhr.send(JSON.stringify(data))
	})
}

let API = {
	user: {
		login (param) {
			return request('/login', param)
		}
	},
	note: {
		list (param) {
			return request('/note/get_list', param)
		},
		create (categoryId) {
			return request('/note/save', { category_id: categoryId, id: 0, title: '新笔记', content: '' })
		},
		update (id, title, content) {
			return request('/note/save', { id, title, content })
		}
	},
	category: {
		list () {
			return request('/category/list')
		},
		create (parent, name) {
			return request('/category/create', { parent, name })
		},
		rename (id, name) {
			return request('/category/rename', { id, name })
		}
	},
}

export default API
