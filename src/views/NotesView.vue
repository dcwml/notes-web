<template>
	<div class="p-notes" :class="{ ready: ready }">
		<div class="hd">
		</div>
		<div class="bd">
			<div class="wrap">
				<div class="left">
					<div class="create-category">
						<div class="title">新建一级分类</div>
						<div class="form-item">
							<input type="text" placeholder="请输入分类名" v-model="createCategoryForm.name">
						</div>
						<div>
							<button @click="createCategory">新建分类</button>
						</div>
					</div>
					<div class="create-note">
						<button @click="createNote" class="button-primary">新建笔记</button>
					</div>
					<CategoryTree :treeData="list"
						@note-selected="onNoteSelected"
						@category-selected="onCategorySelected"
						@create-category="onCreateCategory"
						@rename-category="onRenameCategory"
					></CategoryTree>
				</div>
				<div class="middle">
					<div class="breadcrumb">
						<template v-for="item in breadcrumb" :key="item.id">
							<!-- <font-awesome-icon :icon="['fas', 'angle-right']" /> -->
							<font-awesome-icon class="breadcrumb-item" :icon="faAngleRight" v-if="item.id > 0" />
							<!-- <div class="breadcrumb-item" v-if="item.id > 0">/</div> -->
							<div class="breadcrumb-item breadcrumb-item-name" v-text="item.name"></div>
						</template>
						<!-- <span class="breadcrumb-item" v-text="breadcrumb.parent"></span> -->
					</div>
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
	import { faAngleRight } from "@fortawesome/free-solid-svg-icons";
	import { verify } from '../lib/verify.js'
	import CategoryTree from '../components/CategoryTree.vue'

	export default {
		components: { CategoryTree },
		setup () {},
		data () {
			return {
				ready: false,
				loading: false,
				faAngleRight,
				category: 0,
				breadcrumb: [ { name: '根', id: 0 } ],
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

			// ================================ event handlers ================================

			async createCategory (pointerEvent) {
				if (pointerEvent) this.createCategoryForm.parent = 0
				let parent = this.createCategoryForm.parent
				let name = this.createCategoryForm.name
				let nameVerifyResult = await verify(name, [
					{ required: true, message: '请输入分类名' },
					{ minLen: 1, message: '分类名不能少于1个字符' },
					{ maxLen: 64, message: '分类名不能超过64个字符' },
				])
				if (nameVerifyResult) {
					alert(nameVerifyResult.message)
					return
				}
				try {
					this.loading = true
					await API.category.create(parent, name)
					this.loading = false
					await this.getCategoryList()
					await this.getList()
				} catch (err) {
					alert(err.message)
				}
				this.loading = false
			},

			onCreateCategory (formData) {
				this.createCategoryForm.parent = formData.parent
				this.createCategoryForm.name = formData.name
				this.createCategory()
				this.createCategoryForm.name = ''
			},

			onRenameCategory (formData) {
				this.createCategoryForm.parent = formData.id
				this.createCategoryForm.name = formData.name
				this.renameCategory()
				this.createCategoryForm.name = ''
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
					{ maxLen: 64, message: '分类名不能超过64个字符' },
				])
				if (nameVerifyResult) {
					alert(nameVerifyResult.message)
					return
				}
				try {
					this.loading = true
					await API.category.rename(id, name)
					this.loading = false
					await this.getCategoryList()
					await this.getList()
				} catch (ex) {
					alert(ex.message)
				}
				this.loading = false
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
				// this.updateBreadcrumb('category')
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
				this.updateBreadcrumb('note')
			},

			onBreadcrumbClick (breadcrumbItem) {
				// 暂时没啥用，以后再说吧。
				this.category = breadcrumbItem.id
				let listItem = this.list.find(e => e.type === 'category' && e.modelId === this.category)
				if (listItem) {
					this.onCategorySelected(listItem)
				}
				this.updateBreadcrumb('category')
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
			updateBreadcrumb (by) {
				this.breadcrumb = []
				let findOne = id => {
					let cat = this.allData.find(item => item.name && item.id === id)
					if (!cat) {
						return
					}
					this.breadcrumb.unshift({ id: cat.id, name: cat.name })
					if (cat.parent_id) {
						findOne(cat.parent_id)
					}
					let item = this.list.find(item => item.type === 'category' && item.modelId === cat.id)
					if (!item) return
					item.expand = true
				}
				if (by === 'category') findOne(this.category)
				else if (by === 'note') {
					let note = this.allData.find(item => item.title && item.id === this.note.id)
					if (note) {
						findOne(note.category_id)
					}
				}
				this.breadcrumb.unshift({ name: '根', id: 0 })
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
			z-index: 10;
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
			display: flex;
			flex-wrap: wrap;
			text-align: center;
			padding-bottom: 10px;
		}
		.breadcrumb-item {
			padding-right: 10px;
			padding-bottom: 5px;

			&-name {
				color: var(--color-primary);
				// cursor: pointer;
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
	}
</style>
