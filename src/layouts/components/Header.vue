<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'
import { findMenuTrail } from '@/router/utils/filter'
import { resolveFileUrl } from '@/utils/file'
import { confirm } from '@/utils/feedback'
import UpdatePwd from './UpdatePwd.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const updatePwdRef = useTemplateRef('updatePwdRef')

const breadcrumbs = computed(() =>
  findMenuTrail(permissionStore.menuData, route.path).map(item => ({
    title: item.title,
    path: item.path ? `/${item.path}` : undefined,
  })),
)

function handleUpdatePwd() {
  updatePwdRef.value?.open()
}

async function handleLogout() {
  if (await confirm('确定要退出登录吗？')) {
    await userStore.logout()
    permissionStore.resetRoutes()
    await router.push('/login')
  }
}
</script>

<template>
  <div class="h-14 px-4 flex items-center justify-between bg-white border-b border-slate-200/80">
    <div class="flex items-center gap-3">
      <div
        class="flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer"
        @click="appStore.toggleSidebar()"
      >
        <el-icon :size="16">
          <IconEpFold v-if="appStore.sidebarOpened" />
          <IconEpExpand v-else />
        </el-icon>
      </div>

      <el-breadcrumb separator="/">
        <el-breadcrumb-item
          v-for="(item, index) in breadcrumbs"
          :key="item.path || index"
          :to="item.path"
        >
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="flex items-center gap-1">
      <el-dropdown trigger="click">
        <div
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <el-avatar
            :size="32"
            class="bg-blue-500! text-white!"
            :src="resolveFileUrl(userStore.userInfo?.avatar)"
          >
            {{ userStore.userInfo?.name?.charAt(0)?.toUpperCase() || 'U' }}
          </el-avatar>
          <span class="text-sm font-medium text-slate-700">
            {{ userStore.userInfo?.name || 'Admin' }}
          </span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleUpdatePwd">
              <el-icon><IconEpLock /></el-icon>
              <span>修改密码</span>
            </el-dropdown-item>
            <el-dropdown-item @click="handleLogout">
              <el-icon><IconEpSwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <UpdatePwd ref="updatePwdRef" />
  </div>
</template>
