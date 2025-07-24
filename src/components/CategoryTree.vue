<template>
  <ul class="tree-list">
    <li
      v-for="item in props.treeData"
      :key="item.id"
      :class="itemClass(item)"
      @click="onItemClicked($event, item)"
    >
      <div class="label">
        <div class="icon icon-expand" @click.stop="toggleExpand(item)">
          <font-awesome-icon :icon="faCaretRight" v-if="item.len > 0 && !item.expand" />
          <font-awesome-icon :icon="faCaretDown" v-if="item.len > 0 && item.expand" />
          <span v-if="!item.len" class="icon-placeholder">&nbsp;</span>
        </div>
        <div class="icon">
          <font-awesome-icon
            :icon="faFolderClosed"
            v-if="item.type === 'category' && !item.expand"
          />
          <font-awesome-icon :icon="faFolderOpen" v-if="item.type === 'category' && item.expand" />
          <font-awesome-icon :icon="faFile" v-if="item.type === 'note'" />
        </div>
        <div class="name">
          {{ item.label
          }}<span v-if="item.type === 'category'"> ({{ item.cLen }}, {{ item.nLen }})</span>
        </div>
        <div class="icon icon-actions" @click.stop="showActionMenu($event, item)">
          <font-awesome-icon :icon="faEllipsis" />
          <div class="popup-mask" v-show="item.showMenu" @click.stop="hideActionMenu(item)"></div>
          <div class="popup-menu" v-if="item.showMenu" @click.stop>
            <template v-if="item.type === 'category'">
              <div class="action-group">
                <input
                  type="text"
                  placeholder="新子分类名"
                  v-model="createCategoryName"
                  @keyup.enter="handleCreateCategory(item)"
                />
                <button @click="handleCreateCategory(item)">新建子分类</button>
              </div>
              <div class="action-group">
                <input
                  type="text"
                  placeholder="新分类名"
                  v-model="renameCategoryName"
                  @keyup.enter="handleRenameCategory(item)"
                />
                <button @click="handleRenameCategory(item)">重命名</button>
              </div>
            </template>
            <!-- Future actions can be added here -->
          </div>
        </div>
      </div>
      <CategoryTree
        v-if="item.children && item.children.length"
        v-show="item.expand"
        :treeData="item.children"
        @note-selected="emit('note-selected', $event)"
        @category-selected="emit('category-selected', $event)"
        @create-category="emit('create-category', $event)"
        @rename-category="emit('rename-category', $event)"
        @toggle-expand="(...args) => emit('toggle-expand', ...args)"
        @show-menu="emit('show-menu', $event)"
        @hide-menu="emit('hide-menu')"
      />
    </li>
  </ul>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import {
  faCaretRight,
  faCaretDown,
  faFolderClosed,
  faFolderOpen,
  faFile,
  faEllipsis
} from '@fortawesome/free-solid-svg-icons'

// =========== Props and Emits ===========
const props = defineProps({
  treeData: {
    type: Array,
    required: true
  }
})

const emit = defineEmits([
  'note-selected',
  'category-selected',
  'create-category',
  'rename-category',
  'toggle-expand',
  'show-menu',
  'hide-menu'
])

// =========== State ===========
const createCategoryName = ref('')
const renameCategoryName = ref('')

// =========== Methods ===========
const itemClass = (item) => {
  return {
    'tree-item': true,
    [`tree-item-${item.type}`]: true,
    'tree-item-selected': item.selected,
    open: item.type === 'category' && item.expand
  }
}

const toggleExpand = (item) => {
  if (item.type === 'category' && item.len > 0) {
    // icon-expand 可以切换展开/收起
    emit('toggle-expand', item, false)
  }
}

const onItemClicked = (event, item) => {
  if (item.type === 'category') {
    // 点击分类时，如果未展开则展开（但不收起）
    if (!item.expand && item.len > 0) {
      emit('toggle-expand', item, true) // true 表示强制展开
    }
    emit('category-selected', item)
  } else {
    emit('note-selected', item)
  }
}

const showActionMenu = (event, item) => {
  // 通知父组件显示菜单
  emit('show-menu', item.id)
  createCategoryName.value = ''
  renameCategoryName.value = item.label
}

const hideActionMenu = (item) => {
  emit('hide-menu')
}

const handleCreateCategory = (item) => {
  if (!createCategoryName.value) return
  emit('create-category', { parent: item.modelId, name: createCategoryName.value })
  hideActionMenu(item)
}

const handleRenameCategory = (item) => {
  if (!renameCategoryName.value) return
  emit('rename-category', { id: item.modelId, name: renameCategoryName.value })
  hideActionMenu(item)
}
</script>

<style lang="less" scoped>
ul.tree-list {
  padding-left: 20px;
}

li.tree-item {
  position: relative;

  .label {
    display: flex;
    align-items: center;
    cursor: default;
    height: 28px;

    &:hover {
      background-color: #f5f5f5;
      color: var(--color-primary);
    }
  }

  .icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }
  .icon-placeholder {
    display: inline-block;
    width: 24px;
  }

  .fa-folder-open,
  .fa-folder-closed {
    color: #99f;
  }
  .fa-file {
    color: #9c9;
  }

  .icon-expand,
  .icon-actions {
    cursor: pointer;
  }

  .name {
    flex: 1;
    font-size: 14px;
    line-height: 28px;
    padding-left: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &.tree-item-selected > .label .name {
    font-weight: bold;
    color: var(--color-primary);
  }

  .popup-mask {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-color: rgba(255, 255, 255, 0.1);
    z-index: 4;
  }

  .popup-menu {
    position: absolute;
    left: 24px;
    top: 28px;
    width: 300px;
    box-sizing: border-box;
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
    z-index: 8;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    .action-group {
      display: flex;
      align-items: center;
      padding: 5px 0;

      input {
        flex: 1;
        margin-right: 8px;
      }
    }
  }
}
</style>
