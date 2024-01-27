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
						<div class="item" v-for="item of list" v-bind:key="item.mid">
							<IconFolderOutline></IconFolderOutline>
							{{ item.name }}
						</div>
					</div>
				</div>
				<div class="middle">middle</div>
				<div class="right">
					right
				</div>
			</div>
		</div>
		<div class="ft"></div>
	</div>
</template>

<script>
	import API from '../lib/api.js'
	import { verify } from '../lib/verify.js'
	import IconFolderOutline from '../components/icons/IconFolderOutline.vue'

	export default {
		components: { IconFolderOutline },
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
				}
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
							type: 'category',
							mid: 'c_' + item.id,
							name: item.name
						})
					}
				}
				if (this.allData[this.category].notes) {
					for (let item of this.allData[this.category].notes) {
						arr.push({
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
				getChildren(0)

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
				let ret = await API.note.create(categoryId)
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
		}

		.right {
			flex: 3;
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
			svg {
				width: 24px;
			}
		}
	}
</style>
