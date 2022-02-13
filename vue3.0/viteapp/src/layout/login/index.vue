<template>
  <div class="login">
    <a-form
      :model="formState"
      @finish="handleFinish"
      @finishFailed="handleFinishFailed"
    >
      <a-form-item>
        <a-input v-model:value="formState.user" placeholder="Username">
          <template #prefix
            ><UserOutlined style="color: rgba(0, 0, 0, 0.25)"
          /></template>
        </a-input>
      </a-form-item>
      <a-form-item>
        <a-input
          v-model:value="formState.password"
          type="password"
          placeholder="Password"
        >
          <template #prefix
            ><LockOutlined style="color: rgba(0, 0, 0, 0.25)"
          /></template>
        </a-input>
      </a-form-item>
      <a-form-item>
        <a-button
          type="primary"
          html-type="submit"
          :disabled="formState.user === '' || formState.password === ''"
        >
          Log in
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>
<script>
import { UserOutlined, LockOutlined } from "@ant-design/icons-vue";
import { defineComponent, reactive } from "vue";
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
export default defineComponent({
  name: "login",
  setup() {
    const router = useRouter()
    const store = useStore()
    const formState = reactive({
      user: "",
      password: "",
    });

    const handleFinish = (values) => {
      console.log(values, formState);
      store.commit('user/SET_USERINFO', formState)
      router.replace({ name: 'home' })
    };

    const handleFinishFailed = (errors) => {
      console.log(errors);
    };

    return {
      formState,
      handleFinish,
      handleFinishFailed,
    };
  },

  components: {
    UserOutlined,
    LockOutlined,
  },

  created() {
    this.init();
  },

  methods: {
    init() {
      console.log(this.formState.user);
    },
  },
});
</script>

<style lang="scss" scoped>
.login {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>