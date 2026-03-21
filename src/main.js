import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import router from "./router";
import api from "./api";
import { ElMessage } from "element-plus"; // 保留 ElMessage
// import { ElLoading } from 'element-plus'; // 删除这一行

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.config.globalProperties.$api = api;
app.config.globalProperties.$message = ElMessage;
app.mount("#app");
