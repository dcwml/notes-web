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
							选择父分类:
							<select name="" id="" v-model="createCategoryForm.parent">
								<option value="0">（无）</option>
								<option v-for="item of categoryOptions" v-bind:key="item.value" :value="item.value">{{ item.label }}</option>
							</select>
						</div>
						<div class="form-item">
							输入分类名:
							<input type="text" placeholder="请输入分类名" v-model="createCategoryForm.name">
						</div>
						<div>
							<button @click="createCategory">新建分类</button>
						</div>
					</div>
					<div>
						<button @click="createNote" class="button-primary">新建笔记</button>
					</div>
					<div>
						<div class="item" v-for="item of list" v-bind:key="item.mid" @click="onItemClicked(item)">
							<IconFolderOutline v-if="item.type === 'category'"></IconFolderOutline>
							<IconDocumentOutline v-if="item.type === 'note'"></IconDocumentOutline>
							{{ item.name }}
						</div>
					</div>
				</div>
				<div class="middle">
						<div class="form-item">
							<input type="text" class="title" v-model="note.title" @input="update">
						</div>
						<div class="tip" v-text="tip"></div>
						<div class="form-item editor">
							<textarea v-model="note.content" @input="update"></textarea>
						</div>
				</div>
				<div class="right">
					<div class="content md-preview" v-html="html"></div>
				</div>
			</div>
		</div>
		<div class="ft"></div>
	</div>
</template>

<script>
	import '../assets/marked.min.js'
	import API from '../lib/api.js'
	import { verify } from '../lib/verify.js'
	import IconFolderOutline from '../components/icons/IconFolderOutline.vue'
	import IconDocumentOutline from '../components/icons/IconDocumentOutline.vue'

	export default {
		components: { IconFolderOutline, IconDocumentOutline },
		setup () {},
		data () {
			return {
				ready: false,
				loading: false,
				category: 0,
				allData: { 0: { categoryList: [], noteList: [] } },
				// categoryList: [],
				// noteList: [],
				createCategoryForm: {
					parent: 2,
					name: '',
				},
				note: {
					id: 0,
					title: '',
					content: '',
				},
				html: '',
				timeoutId: 0,
				tip: '请从左边选择一个笔记进行编辑',
			}
		},
		computed: {
			list () {
				if (!this.allData[this.category]) {
					return []
				}
				let arr = []
				if (this.allData[this.category].categories) {
					for (let item of this.allData[this.category].categories) {
						arr.push({
							id: item.id,
							type: 'category',
							mid: 'c_' + item.id,
							name: item.name
						})
					}
				}
				if (this.allData[this.category].notes) {
					for (let item of this.allData[this.category].notes) {
						arr.push({
							id: item.id,
							type: 'note',
							mid: 'n_' + item.id,
							name: item.title
						})
					}
				}
				return arr
			},
			categoryOptions () {
				let arr = []

				let getChildren = parent => {
					if (this.allData[parent]) {
						if(this.allData[parent].categories) {
							for (let item of this.allData[parent].categories) {
								arr.push({ value: item.id, label: item.name })
								getChildren(item.id)
							}
						}
					}
				}
				// getChildren(0)

				return arr
			}
		},
		async mounted () {
			this.getCachedList()
			this.ready = true
			await this.getList()
		},
		methods: {
			getCachedList (parent = 0) {
				// let data = this.getCachedData()
				// if (data[parent]) {
				// 	this.categoryList = data[parent].categoryList
				// 	this.noteList = data[parent].noteList
				// } else {
				// 	this.categoryList = []
				// 	this.noteList = []
				// }
			},
			async getList (parent = 0) {
				let dat = await API.note.list({ parent })
				let data = this.allData
				data[parent] = dat
				console.log(data)
				this.allData = data
				// this.$watch(this.allData, parent, dat)
				// this.categoryList = dat.categoryList
				// this.noteList = dat.noteList
			},

			// ================================ event handlers ================================

			async createCategory () {
				let parent = this.createCategoryForm.parent
				let name = this.createCategoryForm.name
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
					await API.category.create(parent, name)
					this.getList(parent)
				} catch (err) {
					alert(err.message)
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

			async onItemClicked (item) {
				if (item.type === 'category') {
					this.category = item.id
					await this.getList(item.id)
				} else {
					let noteId = item.id
					let note = this.allData[this.category].notes.find(note => note.id === noteId)
					this.note = note
					this.update(false)
					this.tip = '正在编辑 "' + note.title + '" ，所做修改将自动保存。'
				}
			},

			update (autoSave = true) {
				let that = this
				this.html = window.marked.parse(this.note.content)
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
			}
		},
	}
</script>

<style lang="less">
	.p-notes {
		display: none;

		&.ready {
			display: block;
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

			button {
				width: 100%;
			}
		}

		.item {
			cursor: pointer;

			&:hover {
				background-color: #f8f8f8;
				color: var(--color-primary);
			}

			svg {
				width: 24px;
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
