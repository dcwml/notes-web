<template>
  <div class="p-form-editor" :class="{ ready: ready }">
    <FormEditor></FormEditor>
  </div>
</template>

<script>
import FormEditor from '@/components/FormEditor.vue'

export default {
  components: { FormEditor },
  setup() {},
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
.p-form-editor {
  display: none;

  &.ready {
    display: block;
  }
}
</style>
