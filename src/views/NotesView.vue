<template>
	<div class="p-notes" :class="{ ready: ready }">
		<div class="hd">
		</div>
		<div class="bd">
			<div class="wrap">
				<div class="left">
					<div class="create-category">
						<div class="title">新建分类</div>
						<div class="form-item">
							选择分类:
							<select name="" id="" v-model="createCategoryForm.parent">
								<option value="0">（无）</option>
								<option v-for="item of categoryOptions" v-bind:key="item.value" :value="item.value" v-html="item.label"></option>
							</select>
						</div>
						<div class="form-item">
							新建子分类或者修改名称：
							<input type="text" placeholder="请输入分类名" v-model="createCategoryForm.name">
						</div>
						<div>
							<button @click="createCategory">新建分类</button>
							<button @click="renameCategory">重命名</button>
						</div>
					</div>
					<div class="create-note">
						<button @click="createNote" class="button-primary">新建笔记</button>
					</div>
					<div class="breadcrumb">
						<span class="breadcrumb-item" v-text="breadcrumb.parent"></span>
						/
						<span class="breadcrumb-item" v-text="breadcrumb.current"></span>
					</div>
					<CategoryTree :treeData="list" @note-selected="onNoteSelected" @category-selected="onCategorySelected"></CategoryTree>
				</div>
				<div class="middle">
						<div class="form-item">
							<input type="text" class="title" v-model="note.title" @input="update" :disabled="loading">
						</div>
						<div class="tip" v-text="tip"></div>
						<div class="form-item editor">
							<textarea v-model="note.content" @input="update" :disabled="loading"></textarea>
						</div>
				</div>
				<div class="right">
					<div class="content md-preview" v-html="html"></div>
				</div>
			</div>
		</div>
		<div class="ft"></div>

		<div class="loading" v-show="loading"></div>
	</div>
</template>

<script>
	import '../assets/marked.min.js'
	import '../assets/prism.css'
	import API from '../lib/api.js'
	import Prism from "prismjs"
	import { faCaretRight, faCaretDown, faFolderClosed, faFolderOpen, faFile } from "@fortawesome/free-solid-svg-icons";
	import { verify } from '../lib/verify.js'
	import CategoryTree from '../components/CategoryTree.vue'

	export default {
		components: { CategoryTree },
		setup () {},
		data () {
			return {
				ready: false,
				loading: false,
				faCaretRight, faCaretDown, faFolderClosed, faFolderOpen, faFile,
				category: 0,
				breadcrumb: {
					current: '',
					parent: '',
				},
				allData: [],
				list: [],
				categoryList: [],
				// noteList: [],
				createCategoryForm: {
					parent: 0,
					name: '',
				},
				note: {
					id: 0,
					title: '',
					content: '',
				},
				lastTitle: '',
				html: '',
				timeoutId: 0,
				tip: '请从左边选择一个笔记进行编辑',
			}
		},
		computed: {

			categoryOptions () {
				let arr = []

				let getChildren = (parent_id, level) => {
					let list = this.categoryList.filter(item => item.parent_id === parent_id)
					for (let i = 0; i < list.length; i++) {
						const item = list[i]
						arr.push({ value: item.id, label: this.getPrefix(level) + item.name })
						// getChildren(item.id, level + 1)
					}
				}
				getChildren(0, 1)

				return arr
			}
		},
		async mounted () {
			try {
				// this.getCachedList()
				await this.getCategoryList()
				this.ready = true
				await this.getList()
			} catch (ex) {
				alert(ex.message)
			}
		},
		methods: {
			// getCachedList (parent = 0) {
			// 	// let data = this.getCachedData()
			// 	// if (data[parent]) {
			// 	// 	this.categoryList = data[parent].categoryList
			// 	// 	this.noteList = data[parent].noteList
			// 	// } else {
			// 	// 	this.categoryList = []
			// 	// 	this.noteList = []
			// 	// }
			// },
			async getCategoryList () {
				try {
					let ret = await API.category.list()
					// console.log(ret)
					this.categoryList = ret.list
				} catch (err) {
					alert(err.message)
				}
			},
			async getList (parent = 0) {
				let dat = await API.note.list({ parent })
				this.allData = dat
				this.list = this.transformList()
				// this.$watch(this.allData, parent, dat)
				// this.categoryList = dat.categoryList
				// this.noteList = dat.noteList
			},

			async getNote (id) {
				return await API.note.get(id)
			},

			itemClass (item) {
				let cls = 'item'
				if (item.type === 'category' && item.modelId === this.category) {
					cls += ' selected'
				} else if (item.type === 'note' && item.modelId === this.note.id) {
					cls += ' selected'
				}

				if (item.type === 'category' && item.expand) {
					cls += ' open'
				}
				return cls
			},

			// ================================ event handlers ================================

			async createCategory () {
				let parent = this.createCategoryForm.parent
				let name = this.createCategoryForm.name
				let nameVerifyResult = await verify(name, [
					{ required: true, message: '请输入分类名' },
					{ minLen: 1, message: '分类名不能少于1个字符' },
					{ maxLen: 16, message: '分类名不能超过16个字符' },
				])
				if (nameVerifyResult) {
					alert(nameVerifyResult.message)
					return
				}
				try {
					await API.category.create(parent, name)
					await this.getCategoryList()
					await this.getList()
				} catch (err) {
					alert(err.message)
				}
			},

			async renameCategory () {
				let id = this.createCategoryForm.parent
				let name = this.createCategoryForm.name
				if (!id) {
					alert('请选择要重命名的分类')
					return
				}
				let nameVerifyResult = await verify(name, [
					{ required: true, message: '请输入分类名1' },
					{ minLen: 1, message: '分类名不能少于1个字符' },
					{ maxLen: 16, message: '分类名不能超过16个字符' },
				])
				if (nameVerifyResult) {
					alert(nameVerifyResult.message)
					return
				}
				try {
					await API.category.rename(id, name)
					await this.getCategoryList()
					await this.getList()
				} catch (ex) {
					alert(ex.message)
				}
			},

			async createNote () {
				let categoryId = this.category
				let note = await API.note.create(categoryId)
				this.note = note
				this.update()
				document.querySelector('textarea').focus()
				await this.getList(categoryId)
			},

			onCategorySelected (item) {
				this.category = item.modelId
				let set = arr => {
					arr.forEach(e => {
						if (e.type === 'category') {
							e.selected = e.modelId === item.modelId
						}
						if (e.children) {
							set(e.children)
						}
					})
				}
				set(this.list)
				// this.updateBreadcrumb()
			},
			async onNoteSelected (item) {
				let noteId = item.modelId
				this.loading = true
				try {
					let note = await this.getNote(noteId)
					this.note = note
					this.update(false)
					document.querySelector('textarea').focus()
					this.tip = '正在编辑 "' + note.title + '" ，所做修改将自动保存。'
					this.lastTitle = note.title
					this.category = this.note.category_id

					let set = arr => {
						arr.forEach(e => {
							if (e.type === 'note') {
								e.selected = e.modelId === item.modelId
							}
							if (e.children) {
								set(e.children)
							}
						})
					}
					set(this.list)
				} catch (err) {
					alert(err.message)
				}
				this.loading = false
			},

			async onItemClicked () {
				// event.stopPropagation()
				// if (item.type === 'category') {
				// 	this.category = item.modelId
				// 	item.expand = !item.expand
				// 	if (!item.expand) {
				// 		let model = this.allData.find(model => model.id === item.modelId)
				// 		if (model) {
				// 			let parent = this.allData.find(parentModel => parentModel.id === model.parent_id)
				// 			if (parent) {
				// 				this.category = parent.id
				// 			} else {
				// 				this.category = 0
				// 			}
				// 		} else {
				// 			this.category = 0
				// 		}
				// 	}
				// } else {
				// 	let noteId = item.modelId
				// 	this.loading = true
				// 	try {
				// 		let note = await this.getNote(noteId)
				// 		this.note = note
				// 		this.update(false)
				// 		document.querySelector('textarea').focus()
				// 		this.tip = '正在编辑 "' + note.title + '" ，所做修改将自动保存。'
				// 		this.lastTitle = note.title
				// 		this.category = this.note.category_id
				// 	} catch (err) {
				// 		alert(err.message)
				// 	}
				// 	this.loading = false
				// }
				// this.updateBreadcrumb()
			},

			update (autoSave = true) {
				let that = this
				this.html = window.marked.parse(this.note.content)
				setTimeout(() => {
					Prism.highlightAll()
				}, 300);
				if (!autoSave) {
					return
				}
				if (this.timeoutId) {
					clearTimeout(this.timeoutId)
					this.timeoutId = 0
				}
				if (this.note.id) {
					this.timeoutId = setTimeout(() => {
						that.tip = '自动保存中。。。'
						API.note.update(this.note.id, this.note.title, this.note.content).then((ret) => {
							that.tip = '自动保存成功(' + ret.update_time + ')'
							if (that.lastTitle !== that.note.title) that.getList()
							that.lastTitle = that.note.title
						}).catch(err => {
							that.tip = '自动保存失败(' + err.message + ')'
						})
					}, 1000)
					this.tip = '即将自动保存'
				}
			},

			// ================================ private functions ================================

			getCachedData () {
				let value = window.localStorage.getItem('note_data')
				if (!value) return {}
				return JSON.parse(value)
			},
			setDataToCache (parent, data) {
				let dat = this.getCachedData()
				dat[parent] = data
				window.localStorage.setItem('note_data', JSON.stringify(dat))
			},
			getPrefix (level) {
				return '&nbsp;&nbsp;'.repeat(level - 1)
			},
			transformList () {
				let getChildren = (parent_id) => {
					let arr = []
					let expandId = 0
					if (this.category) {
						let expandCategory = this.allData.find(item => item.id === this.category)
						if (expandCategory) {
							expandId = expandCategory.parent_id
						}
					}
					let a = this.allData.filter(item => item.name && item.parent_id === parent_id)
					let b = this.allData.filter(item => item.title && item.category_id === parent_id)
					for (let i = 0; i < a.length; i++) {
						let cLen = this.allData.filter(item => item.name && item.parent_id === a[i].id).length
						let nLen = this.allData.filter(item => item.title && item.category_id === a[i].id).length
						arr.push({
							id: 'c_' + a[i].id,
							modelId: a[i].id,
							label: a[i].name, // + ' (' + cLen + ', ' + nLen + ')',
							type: 'category',
							cLen,
							nLen,
							len: cLen + nLen,
							children: getChildren(a[i].id),
							expand: a[i].id === this.category || a[i].id === expandId,
							selected: a[i].id === this.category,
						})
					}
					for (let i = 0; i < b.length; i++) {
						arr.push({
							id: 'n_' + b[i].id,
							modelId: b[i].id,
							label: b[i].title,
							type: 'note',
							cLen: 0,
							nLen: 0,
							len: 0,
							children: [],
							expand: false,
							// selected: a[i].id === this.note.id,
						})
					}
					return arr
				}

				return getChildren(0)
			},
			updateBreadcrumb () {
				this.breadcrumb.current = ''
				this.breadcrumb.parent = ''
				if (this.category) {
					let current = this.allData.find(item => item.name && item.id === this.category)
					if (current) {
						this.breadcrumb.current = current.name

						let parent = this.allData.find(item => item.name && item.id === current.parent_id)
						if (parent) {
							this.breadcrumb.parent = parent.name
						}
					}
				}
			},
		},
	}
</script>

<style lang="less" scoped>
	.p-notes {
		display: none;

		&.ready {
			display: block;
		}

		.loading {
			position: fixed;
			left: 0;
			top: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(255, 255, 255, 0.5);
		}

		.wrap {
			display: flex;
		}

		.left {
			flex: 1;
		}

		.middle {
			flex: 2;
			box-sizing: border-box;
			padding: 20px;
			display: flex;
			flex-direction: column;
		}

		.right {
			flex: 3;
			box-sizing: border-box;
			padding: 20px;
		}

		.create-category {
			background-color: #9cf;
			border: 1px solid #037aff;
			padding: 10px;

			.title {
				font-weight: bold;
				padding: 0 0 10px 0;
				border-bottom: #037aff 1px solid;
			}

			.form-item {
				padding: 10px 0;
			}

			input {
				width: 100%;
				box-sizing: border-box;
			}
		}

		.create-note {
			padding: 10px;

			button {
				width: 100%;
			}
		}

		.breadcrumb {
			text-align: center;
		}

		.list {
			padding: 10px;
		}

		.list-2 {
			padding-left: 20px;
		}
		.list-3 {
			padding-left: 20px;
		}

		.item {
			cursor: pointer;
			padding-top: 5px;
			padding-bottom: 5px;

			&:hover {
				background-color: #f8f8f8;
				color: var(--color-primary);
			}

			&.selected > .label {
				color: var(--color-primary);
			}

			&.selected > svg {
				color: var(--color-primary);
			}

			svg {
				width: 24px;
			}

			.label {
				display: inline-block;
			}
		}

		.editor {
			flex: 1;
		}

		input.title {
			width: 100%;
			box-sizing: border-box;
		}

		textarea {
			box-sizing: border-box;
			width: 100%;
			height: 100%;
		}

		.tip {
			height: 12px;
			box-sizing: content-box;
			padding: 0 0 8px 0;
			color: #999;
			font-size: 12px;
		}

		.fa-folder-open, .fa-folder-closed {
			color: #cc9;
		}
		.fa-file {
			color: #c9c;
		}
	}
</style>
