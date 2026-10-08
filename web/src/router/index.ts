import { createRouter, createWebHistory } from 'vue-router';
import TwinView from '../views/TwinView.vue';
import StatusView from '../views/StatusView.vue';
import VisionView from '../views/VisionView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/twin' },
    { path: '/twin', name: 'twin', component: TwinView, meta: { title: '实时孪生' } },
    { path: '/status', name: 'status', component: StatusView, meta: { title: '产线状态' } },
    { path: '/vision', name: 'vision', component: VisionView, meta: { title: '视觉检测' } },
  ],
});
