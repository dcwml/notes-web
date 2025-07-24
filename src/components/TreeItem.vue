<template>
  <div class="m-tree-item" :class="{ ready: ready }">
    treeitem
    <div v-text="label"></div>
    <div v-if="children && children.length">
      <Tree :data="children"></Tree>
    </div>
  </div>
</template>

<script>
import Tree from './Tree.vue'

export default {
  components: { Tree },
  setup() {},
  props: {
    label: { type: String, default: '' },
    children: { type: Array, default: () => [] }
  },
  data() {
    return {
      ready: false,
      loading: false
    }
  },
  computed: {},
  mounted() {
    this.ready = true
  },
  methods: {}
}
</script>

<style lang="less">
.m-tree-item {
  display: none;

  &.ready {
    display: block;
  }
}
</style>
