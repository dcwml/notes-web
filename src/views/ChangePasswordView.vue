<template>
  <div class="p-change-password" :class="{ ready: ready }">
    <div class="loading" v-show="loading"></div>
    <div class="change-password-form">
      <h2>修改密码</h2>
      <div class="form-group">
        <input 
          type="password" 
          v-model="form.oldPassword" 
          @keyup.enter="changePassword" 
          placeholder="当前密码" 
        />
      </div>
      <div class="form-group">
        <input 
          type="password" 
          v-model="form.newPassword" 
          @keyup.enter="changePassword" 
          placeholder="新密码" 
        />
      </div>
      <div class="form-group">
        <input 
          type="password" 
          v-model="form.confirmPassword" 
          @keyup.enter="changePassword" 
          placeholder="确认新密码" 
        />
      </div>
      <div class="form-actions">
        <button @click="changePassword" :disabled="!isFormValid">修改密码</button>
        <button @click="goBack" class="btn-secondary">返回</button>
      </div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    </div>
  </div>
</template>

<script>
import API from '../lib/api.js'

export default {
  data() {
    return {
      ready: false,
      loading: false,
      form: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      errorMessage: '',
      successMessage: ''
    }
  },
  computed: {
    isFormValid() {
      return this.form.oldPassword && 
             this.form.newPassword && 
             this.form.confirmPassword && 
             this.form.newPassword === this.form.confirmPassword &&
             this.form.newPassword.length >= 6
    }
  },
  async mounted() {
    this.ready = true
  },
  methods: {
    async changePassword() {
      if (!this.isFormValid) {
        this.errorMessage = '请填写完整信息，新密码至少6位，且两次输入需一致'
        return
      }

      if (this.form.newPassword !== this.form.confirmPassword) {
        this.errorMessage = '两次输入的新密码不一致'
        return
      }

      this.loading = true
      this.errorMessage = ''
      this.successMessage = ''

      try {
        let ret = await API.user.changePassword({
          oldPassword: this.form.oldPassword,
          newPassword: this.form.newPassword
        })
        console.log(ret)
        this.successMessage = '密码修改成功'
        
        setTimeout(() => {
          this.$router.push({ name: 'notes' })
        }, 2000)
      } catch (err) {
        this.errorMessage = err.message
      }
      this.loading = false
    },
    goBack() {
      this.$router.back()
    }
  }
}
</script>

<style lang="less">
.p-change-password {
  display: none;
  position: relative;
  height: 100vh;
  background-color: #f5f5f5;

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

  .change-password-form {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 40px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    min-width: 320px;

    h2 {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
      font-size: 24px;
    }

    .form-group {
      margin-bottom: 20px;

      input {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;

        &:focus {
          outline: none;
          border-color: #007bff;
        }
      }
    }

    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 30px;

      button {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.3s;

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        &:not(.btn-secondary) {
          background-color: #007bff;
          color: white;

          &:hover:not(:disabled) {
            background-color: #0056b3;
          }
        }

        &.btn-secondary {
          background-color: #6c757d;
          color: white;

          &:hover {
            background-color: #545b62;
          }
        }
      }
    }

    .error-message {
      color: #dc3545;
      margin-top: 15px;
      text-align: center;
      font-size: 14px;
    }

    .success-message {
      color: #28a745;
      margin-top: 15px;
      text-align: center;
      font-size: 14px;
    }
  }
}
</style>