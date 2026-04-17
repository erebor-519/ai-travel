import { createRouter, createWebHistory } from 'vue-router'

// 导入页面组件
const Home = () => import('../pages/Home.vue')
const Explore = () => import('../pages/Explore.vue')
const POIExperience = () => import('../pages/POIExperience.vue')
const TravelPlan = () => import('../pages/TravelPlan.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'AI 智能旅行助手 - 首页'
    }
  },
  {
    path: '/explore',
    name: 'Explore',
    component: Explore,
    meta: {
      title: 'AI 智能旅行助手 - 探索'
    }
  },
  {
    path: '/poi-experience',
    name: 'POIExperience',
    component: POIExperience,
    meta: {
      title: 'AI 智能旅行助手 - 景点体验'
    }
  },
  {
    path: '/travel-plan',
    name: 'TravelPlan',
    component: TravelPlan,
    meta: {
      title: 'AI 智能旅行助手 - 旅行计划'
    }
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫，设置页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'AI 智能旅行助手'
  next()
})

export default router