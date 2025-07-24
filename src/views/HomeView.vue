<template>
  <div class="p-home" :class="{ ready: ready }">
    <div class="loading" v-show="loading"></div>
    <div class="login">
      <div><input type="text" v-model="form.name" @keyup.enter="login" placeholder="用户名" /></div>
      <div>
        <input type="password" v-model="form.password" @keyup.enter="login" placeholder="密码" />
      </div>
      <div><button @click="login">登录</button></div>
    </div>
  </div>
</template>

<script>
import API from '../lib/api.js'

export default {
  components: {},
  setup() {},
  data() {
    return {
      ready: false,
      loading: false,
      form: {
        name: '',
        password: ''
      }
    }
  },
  computed: {},
  async mounted() {
    this.ready = true
  },
  methods: {
    async login() {
      this.loading = true
      try {
        let ret = await API.user.login(this.form)
        console.log(ret)
        this.$router.push({ name: 'notes' })
      } catch (err) {
        alert(err.message)
      }
      this.loading = false
    }
  }
}
</script>

<style lang="less">
.p-home {
  display: none;
  position: relative;

  &.ready {
    display: block;
  }

  .loading {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-color: #ffffff7f;
    z-index: 10;
  }

  .login {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
