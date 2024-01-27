<template>
  <div class="p-home" :class="{ ready: ready }">
    <div class="login">
      <input type="text" v-model="form.name">
      <input type="text" v-model="form.password">
      <button @click="login">登录</button>
    </div>
  </div>
</template>

<script>
  import API from '../lib/api.js'

  export default {
    components: {},
    setup () {},
    data () {
      return {
        ready: false,
        loading: false,
        form: {
          name: '',
          password: '',
        }
      }
    },
    computed: {},
    async mounted () {
      this.ready = true
    },
    methods: {
      async login () {
        this.loading = true
        try {
          let ret = await API.user.login(this.form)
          console.log(ret)
          this.$router.push({ name: 'notes' })
        } catch (err) {
          alert(err.message)
        }
      }
    },
  }
</script>

<style lang="less">
  .p-home {
    display: none;

    &.ready {
      display: block;
    }
  }
</style>
