<template>
  <div class="p-notes" :class="{ ready: ready }">
    <!-- 非阻塞式通知 -->
    <div v-if="notification.show" class="notification" :class="`is-${notification.type}`">
      {{ notification.message }}
      <button class="close" @click="notification.show = false">&times;</button>
    </div>

    <div class="bd">
      <div class="wrap">
        <div class="left">
          <div class="create-category">
            <div class="title">新建一级分类</div>
            <div class="form-item">
              <input
                type="text"
                placeholder="请输入分类名"
                v-model="createCategoryForm.name"
                @keyup.enter="handleCreateRootCategory"
              />
            </div>
            <div>
              <button @click="handleCreateRootCategory" :disabled="isTreeLoading">新建分类</button>
            </div>
          </div>
          <div class="create-note">
            <button @click="handleCreateNote" class="button-primary" :disabled="isTreeLoading">
              新建笔记
            </button>
          </div>
          <CategoryTree
            v-if="!isTreeLoading"
            :treeData="transformedList"
            @note-selected="onNoteSelected"
            @category-selected="onCategorySelected"
            @create-category="onCreateCategory"
            @rename-category="onRenameCategory"
            @toggle-expand="onToggleExpand"
            @show-menu="onShowMenu"
            @hide-menu="onHideMenu"
          />
          <div v-if="isTreeLoading" class="loading-placeholder">正在加载目录...</div>
        </div>
        <div class="middle">
          <div class="breadcrumb">
            <template v-for="(item, index) in breadcrumb" :key="item.id">
              <font-awesome-icon class="breadcrumb-item" :icon="faAngleRight" v-if="index > 0" />
              <div class="breadcrumb-item breadcrumb-item-name" v-text="item.name"></div>
            </template>
          </div>
          <div class="form-item">
            <input
              type="text"
              class="title"
              v-model="note.title"
              @input="handleNoteUpdate"
              :disabled="isNoteLoading || !note.id"
            />
          </div>
          <div class="tip" v-text="autoSaveTip"></div>
          <div class="form-item editor">
            <textarea
              ref="editorTextarea"
              v-model="note.content"
              @input="handleNoteUpdate"
              :disabled="isNoteLoading || !note.id"
            ></textarea>
          </div>
        </div>
        <div class="right">
          <div ref="previewContainer" class="content md-preview" v-html="parsedMarkdown"></div>
        </div>
      </div>
    </div>
    <div class="ft"></div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue'
import '../assets/marked.min.js'
import '../assets/prism.css'
import API from '../lib/api.js'
import Prism from 'prismjs'
import { faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { verify } from '../lib/verify.js'
import CategoryTree from '../components/CategoryTree.vue'

// =========== 响应式状态定义 (Reactive State) ===========

const ready = ref(false)
const isTreeLoading = ref(false)
const isNoteLoading = ref(false)

// 通知状态
const notification = reactive({
  show: false,
  message: '',
  type: 'info' // 'info', 'success', 'error'
})

// 数据
const allData = ref([]) // 扁平化的笔记和分类列表
const currentCategoryId = ref(0)
const note = reactive({
  id: 0,
  title: '',
  content: '',
  category_id: 0
})

// UI状态管理
const expandedCategories = ref(new Set()) // 存储展开的分类ID
const activeMenuId = ref(null) // 当前显示菜单的项目ID

// 表单
const createCategoryForm = reactive({
  parent: 0,
  name: ''
})

// UI
const breadcrumb = ref([{ name: '根', id: 0 }])
const autoSaveTip = ref('请从左边选择一个笔记进行编辑')
const editorTextarea = ref(null) // 编辑器DOM引用
const previewContainer = ref(null) // 预览区DOM引用

// 自动保存相关
let autoSaveTimeoutId = null
let lastTitle = ''

// =========== 计算属性 (Computed Properties) ===========

// 将扁平数据转换为目录树结构
const transformedList = computed(() => {
  const getChildren = (parentId) => {
    const children = []
    const categories = allData.value.filter((item) => item.name && item.parent_id === parentId)
    const notes = allData.value.filter((item) => item.title && item.category_id === parentId)

    // 自动展开当前分类的父级
    let expandId = 0
    const expandCategory = allData.value.find((item) => item.name && item.id === currentCategoryId.value)
    if (expandCategory) {
      expandId = expandCategory.parent_id
    }

    for (const cat of categories) {
      const cLen = allData.value.filter((item) => item.name && item.parent_id === cat.id).length
      const nLen = allData.value.filter((item) => item.title && item.category_id === cat.id).length
      
      // 检查是否应该展开
      const shouldExpand = expandedCategories.value.has(cat.id) || 
                          cat.id === expandId
      
      children.push({
        id: 'c_' + cat.id,
        modelId: cat.id,
        label: cat.name,
        type: 'category',
        cLen,
        nLen,
        len: cLen + nLen,
        children: getChildren(cat.id),
        expand: shouldExpand,
        selected: cat.id === currentCategoryId.value,
        showMenu: activeMenuId.value === 'c_' + cat.id
      })
    }

    for (const n of notes) {
      children.push({
        id: 'n_' + n.id,
        modelId: n.id,
        label: n.title,
        type: 'note',
        len: 0,
        children: [],
        expand: false,
        selected: n.id === note.id,
        showMenu: activeMenuId.value === 'n_' + n.id
      })
    }
    return children
  }
  return getChildren(0)
})

// Markdown解析
const parsedMarkdown = computed(() => {
  if (window.marked) {
    return window.marked.parse(note.content || '')
  }
  return ''
})

// =========== 方法 (Methods) ===========

// --- 通知 ---
function showNotification(message, type = 'error', duration = 3000) {
  notification.message = message
  notification.type = type
  notification.show = true
  setTimeout(() => {
    notification.show = false
  }, duration)
}

// --- 数据获取与处理 ---
async function fetchAllData() {
  isTreeLoading.value = true
  try {
    allData.value = await API.note.list({ parent: 0 }) // 假设API返回所有数据
  } catch (err) {
    showNotification(err.message || '数据加载失败')
  } finally {
    isTreeLoading.value = false
  }
}

async function fetchNote(id) {
  isNoteLoading.value = true
  try {
    const fetchedNote = await API.note.get(id)
    Object.assign(note, fetchedNote)
    lastTitle = note.title
    autoSaveTip.value = `正在编辑 "${note.title}" ，所做修改将自动保存。`
    editorTextarea.value?.focus()
    updateBreadcrumb('note')
  } catch (err) {
    showNotification(err.message || '笔记加载失败')
  } finally {
    isNoteLoading.value = false
  }
}

// --- 分类操作 ---
async function handleCreateRootCategory() {
  await createCategory(0, createCategoryForm.name)
  createCategoryForm.name = ''
}

async function onCreateCategory(formData) {
  await createCategory(formData.parent, formData.name)
}

async function createCategory(parentId, name) {
  const nameVerifyResult = await verify(name, [
    { required: true, message: '请输入分类名' },
    { minLen: 1, message: '分类名不能少于1个字符' },
    { maxLen: 64, message: '分类名不能超过64个字符' }
  ])
  if (nameVerifyResult) {
    showNotification(nameVerifyResult.message)
    return
  }

  isTreeLoading.value = true
  try {
    await API.category.create(parentId, name)
    await fetchAllData()
    showNotification('分类创建成功', 'success')
  } catch (err) {
    showNotification(err.message || '分类创建失败')
  } finally {
    isTreeLoading.value = false
  }
}

async function onRenameCategory(formData) {
  const { id, name } = formData
  const nameVerifyResult = await verify(name, [
    { required: true, message: '请输入分类名' },
    { minLen: 1, message: '分类名不能少于1个字符' },
    { maxLen: 64, message: '分类名不能超过64个字符' }
  ])
  if (nameVerifyResult) {
    showNotification(nameVerifyResult.message)
    return
  }

  isTreeLoading.value = true
  try {
    await API.category.rename(id, name)
    await fetchAllData() // 重命名后需要刷新整个树
    showNotification('分类重命名成功', 'success')
  } catch (err) {
    showNotification(err.message || '分类重命名失败')
  } finally {
    isTreeLoading.value = false
  }
}

// --- 笔记操作 ---
async function handleCreateNote() {
  isTreeLoading.value = true
  try {
    const newNote = await API.note.create(currentCategoryId.value)
    // 展开新笔记所在的分类
    if (currentCategoryId.value > 0) {
      expandedCategories.value.add(currentCategoryId.value)
    }
    await fetchAllData() // 创建新笔记后刷新树
    await onNoteSelected({ modelId: newNote.id }) // 选中新笔记
    showNotification('新笔记已创建', 'success')
  } catch (err) {
    showNotification(err.message || '创建笔记失败')
  } finally {
    isTreeLoading.value = false
  }
}

function handleNoteUpdate() {
  if (autoSaveTimeoutId) clearTimeout(autoSaveTimeoutId)
  if (!note.id) return

  autoSaveTip.value = '即将自动保存...'
  autoSaveTimeoutId = setTimeout(async () => {
    autoSaveTip.value = '自动保存中...'
    try {
      const ret = await API.note.update(note.id, note.title, note.content)
      autoSaveTip.value = `自动保存成功 (${ret.update_time})`

      // 优化：只在本地更新标题，不重新拉取整个列表
      if (lastTitle !== note.title) {
        const noteInList = allData.value.find((item) => item.id === note.id && item.title)
        if (noteInList) {
          noteInList.title = note.title
        }
        lastTitle = note.title
      }
    } catch (err) {
      autoSaveTip.value = `自动保存失败 (${err.message})`
    }
  }, 1000)
}

// --- UI 事件处理 ---
function onCategorySelected(item) {
  // 强制触发响应式更新
  currentCategoryId.value = item.modelId
  
  // 选中分类时自动展开（如果有子项）
  if (item.len > 0) {
    expandedCategories.value.add(item.modelId)
  }
  updateBreadcrumb('category')
  
  // 强制刷新计算属性
  nextTick(() => {
    console.log('Category selected:', item.label, 'id:', item.modelId)
  })
}

// 处理分类展开/收起
function onToggleExpand(item, forceExpand = false) {
  if (forceExpand) {
    // 强制展开（用于点击 icon 或 name）
    expandedCategories.value.add(item.modelId)
  } else {
    // 切换展开/收起（用于点击 icon-expand）
    if (expandedCategories.value.has(item.modelId)) {
      expandedCategories.value.delete(item.modelId)
    } else {
      expandedCategories.value.add(item.modelId)
    }
  }
}

// 处理菜单显示/隐藏
function onShowMenu(itemId) {
  activeMenuId.value = itemId
}

function onHideMenu() {
  activeMenuId.value = null
}

async function onNoteSelected(item) {
  note.id = item.modelId
  await fetchNote(item.modelId)
  
  // 获取笔记的分类ID并更新当前分类
  const selectedNote = allData.value.find((n) => n.id === item.modelId && n.title)
  if (selectedNote) {
    currentCategoryId.value = selectedNote.category_id
  }
}

// --- 面包屑和TOC ---
function updateBreadcrumb(by) {
  const newBreadcrumb = []
  let findOne = (id) => {
    const cat = allData.value.find((item) => item.name && item.id === id)
    if (!cat) return
    newBreadcrumb.unshift({ id: cat.id, name: cat.name })
    if (cat.parent_id) {
      findOne(cat.parent_id)
    }
  }

  if (by === 'category') {
    findOne(currentCategoryId.value)
  } else if (by === 'note') {
    const currentNote = allData.value.find((item) => item.title && item.id === note.id)
    if (currentNote) {
      findOne(currentNote.category_id)
    }
  }
  breadcrumb.value = [{ name: '根', id: 0 }, ...newBreadcrumb]
}

function updateTOC() {
  const previewEl = previewContainer.value
  if (!previewEl) return

  const tocPlaceholder = Array.from(previewEl.querySelectorAll('p, div')).find(
    (el) => el.textContent.trim() === '[TOC]'
  )
  if (!tocPlaceholder) return

  const headings = previewEl.querySelectorAll('h1, h2, h3, h4, h5, h6')
  if (headings.length === 0) {
    tocPlaceholder.innerHTML = ''
    return
  }

  const tocContainer = document.createElement('div')
  tocContainer.className = 'toc-container'

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.substring(1))
    const anchor = document.createElement('a')
    anchor.textContent = heading.textContent
    anchor.href = 'javascript:void(0);'
    anchor.style.paddingLeft = `${(level - 1) * 20}px`
    anchor.onclick = () => {
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    tocContainer.appendChild(anchor)
  })

  tocPlaceholder.innerHTML = ''
  tocPlaceholder.appendChild(tocContainer)
}

// =========== 生命周期钩子 (Lifecycle Hooks) ===========

onMounted(async () => {
  await fetchAllData()
  ready.value = true
})

// 监听Markdown变化，更新代码高亮和TOC
watch(parsedMarkdown, async () => {
  await nextTick()
  Prism.highlightAll()
  updateTOC()
})
</script>

<style lang="less" scoped>
.p-notes {
  display: none;

  &.ready {
    display: block;
  }

  .wrap {
    display: flex;
    height: calc(100vh - 50px); // 假设有一些头部高度
  }

  .left {
    flex: 0 0 380px;
    border-right: 1px solid #eee;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .middle {
    flex: 0 0 500px;
    box-sizing: border-box;
    padding: 20px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #eee;
  }

  .right {
    flex: 1;
    box-sizing: border-box;
    padding: 20px;
    overflow-y: auto;
  }

  .create-category {
    background-color: #f0f8ff;
    border: 1px solid #e0e0e0;
    padding: 10px;
    margin: 10px;
    border-radius: 4px;

    .title {
      font-weight: bold;
      padding-bottom: 10px;
      border-bottom: #e0e0e0 1px solid;
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
    padding: 0 10px 10px 10px;
    button {
      width: 100%;
    }
  }

  .breadcrumb {
    display: flex;
    flex-wrap: wrap;
    padding-bottom: 10px;
    align-items: center;
  }
  .breadcrumb-item {
    padding-right: 8px;
    color: #999;

    &-name {
      color: var(--color-primary);
    }
  }

  .editor {
    flex: 1;
    display: flex;
  }

  input.title {
    width: 100%;
    box-sizing: border-box;
    font-size: 1.2em;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  textarea {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 8px;
    font-family: monospace;
  }

  .tip {
    height: 12px;
    box-sizing: content-box;
    padding: 8px 0;
    color: #999;
    font-size: 12px;
  }

  .loading-placeholder {
    padding: 20px;
    text-align: center;
    color: #999;
  }

  .notification {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    border-radius: 5px;
    color: #fff;
    z-index: 1000;
    display: flex;
    align-items: center;

    &.is-success {
      background-color: #4caf50;
    }
    &.is-error {
      background-color: #f44336;
    }
    &.is-info {
      background-color: #2196f3;
    }

    .close {
      background: none;
      border: none;
      color: #fff;
      font-size: 20px;
      margin-left: 15px;
      cursor: pointer;
    }
  }
}
</style>
<style lang="less">
// TOC的全局样式，因为它是动态插入的
.toc-container {
  border: 1px solid #eee;
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  a {
    display: block;
    text-decoration: none;
    color: #333;
    padding: 4px 0;
    &:hover {
      color: var(--color-primary);
    }
  }
}
</style>
