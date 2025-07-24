<template>
  <div class="m-form-editor" :class="{ ready: ready }">
    <div class="form-wrap">
      <div class="field-wrap">
        <div class="field-container">
          <label>
            <span>abcde</span>
            <input type="text" />
          </label>
        </div>
      </div>
      <div class="field-wrap">b</div>
      <div class="field-wrap">c</div>
      <div class="field-wrap">d</div>
    </div>
  </div>
</template>

<script>
export default {
  components: {},
  setup() {},
  data() {
    return {
      ready: false,
      loading: false,
      fields: []
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
.m-form-editor {
  display: none;

  &.ready {
    display: block;
  }

  .form-wrap {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .field-wrap {
    width: 34%;
    box-sizing: border-box;
  }
}
</style>
