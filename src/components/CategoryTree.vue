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
				<div class="icon icon-actions"><font-awesome-icon :icon="faEllipsis" /></div>
			</div>
			<CategoryTree :treeData="item.children" v-show="item.expand && item.children.length" @note-selected="onNoteSelected" @category-selected="onCategorySelected"></CategoryTree>
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
		}
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
		}
	}
};
</script>

<style lang="less">
	ul.tree-list {
		padding-left: 20px;
	}

	li.tree-item {
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
			cursor: pointer;
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
	}
</style>
