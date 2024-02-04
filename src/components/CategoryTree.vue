<template>
	<ul class="tree-list">
		<li v-for="item of treeData" v-bind:key="item.id" :class="itemClass(item)" @click="onItemClicked($event, item)">
			<div class="label">
				<div class="icon icon-expand" @click="onExpandIconClicked($event, item)">
					<font-awesome-icon :icon="faCaretRight" v-if="item.len > 0 && !item.expand" />
					<font-awesome-icon :icon="faCaretDown" v-if="item.len > 0 && item.expand" />
					<span style="display: inline-block; width: 24px;" v-if="!item.len">&nbsp;</span>
				</div>
				<div class="icon">
					<font-awesome-icon :icon="faFolderClosed" v-if="item.type === 'category' && !item.expand" />
					<font-awesome-icon :icon="faFolderOpen" v-if="item.type === 'category' && item.expand" />
					<font-awesome-icon :icon="faFile" v-if="item.type === 'note'" />
				</div>
				<div class="name">{{ item.label }}<span v-if="item.type === 'category'">({{ item.cLen }}, {{ item.nLen }})</span></div>
				<div class="icon icon-actions" @click="onItemActionClicked($event, item)">
					<font-awesome-icon :icon="faEllipsis" />
					<div class="popup-mask" v-show="item.showMenu" @click.stop="hideActionMenu(item)"></div>
					<div class="popup-menu" v-if="item.showMenu" @click.stop>
						<div class="create" v-show="item.type === 'category'">
							<div><input type="text" placeholder="请输入分类名" v-model="createCategoryForm.name"></div>
							<div><button @click="onCreateCategory()">新建子分类</button></div>
						</div>
						<div class="rename" v-show="item.type === 'category'">
							<div><input type="text" placeholder="请输入分类名" v-model="renameCategoryForm.name"></div>
							<div><button @click="onRenameCategory()">重命名</button></div>
						</div>
						<!-- <div class="move">
							<div>
								<select name="" id=""></select>
							</div>
							<div><button>移动</button></div>
						</div>
						<div class="create-note">
							<div><button>新建笔记</button></div>
						</div>
						<div class="delete">
							<div><button>删除</button></div>
						</div> -->
					</div>
				</div>
			</div>
			<CategoryTree :treeData="item.children" v-show="item.expand && item.children.length"
				@note-selected="onNoteSelected"
				@category-selected="onCategorySelected"
				@create-category="onCreateCategory"
			></CategoryTree>
		</li>
	</ul>
</template>

<script>
import { faCaretRight, faCaretDown, faFolderClosed, faFolderOpen, faFile, faEllipsis } from "@fortawesome/free-solid-svg-icons";
export default {
	name: 'CategoryTree',
	props: {
		treeData: {
			type: Array,
			required: true,
		}
	},
	data () {
		return {
			faCaretRight, faCaretDown, faFolderClosed, faFolderOpen, faFile, faEllipsis,
			createCategoryForm: {
				parent: 0,
				name: '',
			},
			renameCategoryForm: {
				name: '',
			}
		}
	},
	computed: {},
	mounted () {
		this.treeData.forEach(item => {
			item.showMenu = false
		});
	},
	methods: {
		itemClass (item) {
			let cls = 'tree-item'
			cls += ' tree-item-' + item.type
			if (item.selected) {
				cls += ' tree-item-selected'
			}

			if (item.type === 'category' && item.expand) {
				cls += ' open'
			}
			return cls
		},
		onExpandIconClicked (event, item) {
			event.stopPropagation()
			item.expand = !item.expand
		},
		onItemClicked(event, item) {
			event.stopPropagation()
			if (item.type === 'category') {
				item.expand = true
				this.$emit('category-selected', item);
			} else {
				this.$emit('note-selected', item)
			}
		},
		onNoteSelected (noteItem) {
			this.$emit('note-selected', noteItem);
		},
		onCategorySelected (categoryItem) {
			this.$emit('category-selected', categoryItem);
		},
		onItemActionClicked (event, item) {
			event.stopPropagation()
			this.createCategoryForm.parent = item.modelId
			this.createCategoryForm.name = ''
			this.renameCategoryForm.id = item.modelId
			this.renameCategoryForm.name = item.label
			item.showMenu = true
		},
		hideActionMenu (item) {
			item.showMenu = false
		},
		onCreateCategory (formData) {
			this.$emit('create-category', formData || this.createCategoryForm)
		},
		onRenameCategory (formData) {
			this.$emit('rename-category', formData || this.renameCategoryForm)
		},
	}
};
</script>

<style lang="less">
	ul.tree-list {
		padding-left: 20px;
	}

	li.tree-item {
		position: relative;
		.label {
			display: flex;
			cursor: default;

			&:hover {
				background-color: #f5f5f5;
				color: var(--color-primary);
			}
		}
		.icon {
			width: 24px;
			height: 24px;
			padding: 2px;
			font-size: 20px;
			box-sizing: border-box;
		}
		.fa-folder-open, .fa-folder-closed {
			color: #99f;
		}
		.fa-file {
			color: #9c9;
		}
		.icon-expand, .icon-actions {
			svg {
				cursor: pointer;
			}
		}
		.name {
			flex: 1;
			font-size: 14px;
			line-height: 24px;
			padding-left: 4px;
			height: 24px;
			box-sizing: border-box;
		}
		&.tree-item-selected {
			& > .label .name {
				font-weight: bold;
				color: var(--color-primary);
			}
		}

		.popup-mask {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			right: 0;
			background-color: rgba(255, 255, 255, 0.4);
			z-index: 4;
		}

		.popup-menu {
			position: absolute;
			width: 334px;
			box-sizing: border-box;
			background-color: #fff;
			border: 1px solid #eee;
			border-radius: 4px;
			padding: 10px;
			z-index: 8;
			box-shadow: 0px 0px 10px #0000001f;

			.create, .rename, .move, .create-note {
				display: flex;
				border-bottom: 1px solid #ccc;
				padding-top: 10px;
			}

			.delete, .create-note {
				padding-top: 10px;
			}
		}
	}
</style>
