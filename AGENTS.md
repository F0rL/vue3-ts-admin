# AGENTS.md

## 技术栈

Vue 3.5（TypeScript）+ Vite 8 + Pinia 4 + Vue Router 5 + Element Plus 2 + Tailwind CSS 4 + SCSS + @tanstack/vue-query。

## 命令

```
pnpm dev           # 开发服务器 → http://localhost:4000/admin/
pnpm build         # 生产构建 → dist/
pnpm preview       # 预览生产构建
pnpm lint          # ESLint 检查源码文件
pnpm typecheck     # vue-tsc 类型检查
```

仅允许使用 `pnpm`——由 `packageManager`（corepack）+ `devEngines.packageManager` 强制执行。

## 工程原则

### 验证

代码编写完成后必须同时通过 `pnpm lint` 和 `pnpm typecheck`。`lint` 管风格和语法，`typecheck` 管类型推断。

### 优先使用成熟的第三方包

在编写自定义代码前，先检查是否有维护良好的社区包已解决该问题（日期→`dayjs`、工具函数→`@vueuse/core`、图表→`echarts`、加密→`node-forge`）。不要从零构建事件总线、防抖/节流、剪贴板、全屏、暗色模式切换或 localStorage 封装——`@vueuse/core` 已覆盖。

### 路径别名

`@` → `src/`（`vite.config.ts` 和 `tsconfig.json` 均已配置）。

### 环境变量与配置

`src/config/index.ts` 提供类型化的 `config` 对象，统一读取 `VITE_APP_BASE_URL`、`VITE_APP_BASE_API`、`VITE_APP_TITLE`、`VITE_APP_STORAGE_NS`。全局通过 `config.XXX` 访问，禁止直接写 `import.meta.env.VITE_APP_*`。

## 架构

### 自动导入

- Element Plus API（`ElMessage`、`ElMessageBox`）自动注入，无需手动导入。
- Element Plus 组件自动导入，直接使用 `<el-button>` 等标签。
- 图标组件前缀 `Icon`（如 `<IconEpUser />`），无需手动注册。
- `vue`、`vue-router`、`pinia` 的自动导入已禁用，必须显式 `import`。

### Store 规范

- 全部使用 Setup 语法：`defineStore('id', () => { ... }, { persist })`。禁止 Options API。
- pinia 实例由 `src/stores/index.ts` 创建并默认导出，非组件代码（如 axios 拦截器）导入该实例以在 `<script setup>` 上下文之外使用 store。
- Store 列表：
  - **user** — `token`、`userInfo`、`isLoggedIn`、`roles`、`login`/`loadUserInfo`/`logout`/`resetToken`，persist `['token','userInfo']`
  - **permission** — `menuData`（后端返回）、`isRoutesLoaded`、`generateRoutes`/`resetRoutes`/`refreshMenu`，不 persist
  - **app** — `sidebarOpened`、`sidebarIconOnly`、`device`、`size` 及 toggler，persist `['sidebarOpened','size']`
  - **remember** — 加密持久化"记住我"凭证（7 天过期），persist `['cipherText']`（仅密文，绝不存明文）

### 路由与侧边栏联动

侧边栏读取 `permissionStore.menuData`（后端 `fetchUserRightMenu()` 返回的菜单树）渲染，通过 `isMenuShow` 字段控制可见性。

`src/router/index.ts` 导出 `asyncRoutes`（按模块拆分至 `src/router/modules/`）。`permissionStore.generateRoutes()` 从后端菜单收集允许的路径集合，过滤 `asyncRoutes` 后通过 `router.addRoute` 动态注册 Layout 路由。新增页面时在 `asyncRoutes` 中声明路由并设置 `meta.title`。

路由使用 `createWebHistory(config.BASE_URL)`，`config.BASE_URL` 与 Vite 的 `base` 均来自 `VITE_APP_BASE_URL`（`/admin/`）。

### Token 存储

Token 通过 `pinia-plugin-persistedstate` 持久化。storage key 格式为 `${config.STORAGE_NS}:${storeId}`，逻辑内联在 `src/stores/index.ts` 中。`src/utils/auth.ts` 已删除。

### 动态图标必须使用 iconMap

静态标签 `<IconEpUser />` 由 `unplugin-vue-components` 自动解析。动态方式 `<component :is="iconName" />` 必须使用 `src/icons/index.ts` 导出的 `iconMap`。

新增侧边栏菜单图标时在 `src/icons/ep.ts` 或 `src/icons/ri.ts` 同步添加 import 和映射条目。

### Tailwind CSS v4

使用 `@tailwindcss/vite` 插件，通过 CSS 的 `@theme` 指令配置——无 `tailwind.config.js` / `postcss.config.js`。

`tailwind.css` 中 `@import 'tailwindcss'` 未导入 preflight，以避免与 Element Plus 基础样式冲突。

`@theme` 将 Tailwind 颜色 token 映射到 Element Plus CSS 变量（`--color-primary: var(--el-color-primary)` 等），使 `bg-primary` / `text-primary` 等工具类与 Element Plus 主题保持运行时同步。

### sass-embedded

`api: 'modern-compiler'`——SCSS 文件必须使用 `@use`/`@forward` 语法，不能使用 `@import`。

## 数据层规范

### API 文件结构

每个领域一个文件，放在 `src/api/{domain}.ts`。单文件内按"类型 → API 函数 → 查询键"顺序排列。API 函数是纯异步函数，对 vue-query 零感知，只负责请求和返回数据。参考 `src/api/menu.ts`。

### 响应解包

后端统一返回 `ApiResponse<T>`（`{ flag, msg, total, time, code }`，定义在 `src/types/global.d.ts`）。解包逻辑集中在 `@/utils/http`：

- `apiGet<T>` — 单实体/树形数据，返回 `msg`（即 `T`）
- `apiGetList<T>` — 分页列表，返回 `{ items: T[], total }`
- `apiPost<T>` — 增删改，返回 `msg`

业务错误（`code !== 0`）由解包层统一处理并 reject，调用方无需重复判断。

### vue-query 使用约束

| 场景 | 用 | 不用 |
|---|---|---|
| 组件内数据获取 | `useQuery` | 裸 axios / 手动 loading |
| 需要生命周期钩子的写操作 | `useMutation` | 裸调用 + try/catch |
| 一次性调用（loading 由 withLoading 接管） | 直接调 API 函数 | `useMutation` |
| Store 中的命令式请求（login、generateRoutes） | 直接调 API 函数 | vue-query |

**useQuery 必须内联写在视图中**，queryKey 和 queryFn 同处可见。不为单一使用者创建 `queryOptions` 工厂或独立查询文件。

**useMutation 仅在确实用到 onMutate / onSuccess / onError / onSettled 时使用**；生命周期内完成副作用（失效缓存、提示、loading 清理），不要在事件处理函数里重复写。

### 共享 QueryClient

`src/lib/queryClient.ts` 导出预配置的 `queryClient` 实例：`staleTime: 0`、`gcTime: 5min`、`retry: 1`（查询）/ `retry: 0`（变更）、`refetchOnWindowFocus: false`。需要 `invalidateQueries` / `useQueryClient` 时导入该实例。

### 查询键

查询键工厂放在 API 文件末尾，仅保留实际用于 `invalidateQueries` 的条目，采用层级前缀结构：

```
['menus']           ← menuKeys.all       失效所有菜单缓存
['menus', 'tree']   ← menuKeys.trees()   只失效树形数据
```

### 缓存失效

写操作成功后通过 `queryClient.invalidateQueries({ queryKey: 对应键 })` 精确失效相关缓存。禁止手动调用 refetch。

### Store 与查询边界

Store 持有跨页面共享的应用状态（token、用户信息、路由菜单）；vue-query 管理服务端数据缓存。login、generateRoutes 等一次性命令式操作直接调 API 函数，不进查询缓存。

## HTTP 层

`src/utils/http/` 结构：

```
├── index.ts        # axios 实例 + 拦截器（token 注入、HTTP 错误处理）
├── apiHelpers.ts   # createApiHelpers(http) 响应解包工厂
└── error.ts        # isSuccess / handleBusinessError / handleNetworkError
```

`apiGet`/`apiPost`/`apiGetList` 绑定默认实例。多实例场景使用 `createApiHelpers(新实例)` 工厂。

## 工具函数

| 文件 | 用途 |
|---|---|
| `src/utils/feedback.ts` | `message` / `notify` / `confirm` / `alert` / `prompt` / `withLoading` 统一封装，所有用户反馈统一走这里 |
| `src/utils/encrypt.ts` | `encryptPwdRsa`（RSA 加密密码）、`md5Hash`、`encryptText`/`decryptText`（AES-256-CBC） |
| `src/utils/dayjs.ts` | dayjs 实例（中文 locale、relativeTime、utc、customParseFormat 插件） |
| `src/utils/validate.ts` | `isEmail`、`isMobile`、`isURL`、`isIdCard` |

## 共享组件

| 组件 | 文件 | 用途 |
|---|---|---|
| ProTable | `src/components/ProTable/index.vue` | 泛型配置驱动表格，支持 selection/expand/tag 列、valueEnum 字典、排序、分页，通过 props 透传绑定 |
| SelectIcon | `src/components/SelectIcon/index.vue` | 图标选择器（popover + 双标签页），v-model 绑定图标字符串 |
| ContactSelect | `src/components/ContactSelect/index.vue` | 企业微信组织架构选人弹窗，支持单选/多选，通过 `defineExpose({ open })` 调用返回 Promise |

## 页面代码规范

### 方法排列顺序

```
imports → defineProps/defineEmits → composables（无状态依赖） → ref/reactive →
computed → composables（依赖状态，如 useQuery/useMutation）→ 共享辅助函数 →
事件处理（按界面区域分组）→ defineExpose
```

无状态依赖的 composables（`useQueryClient`、`useStore`）前置；依赖本地 ref 的 `useQuery`/`useMutation` 后置。不需要分块注释标记。

### 注释

仅在关键交互入口（打开抽屉、删除确认、切换状态）添加 JSDoc 风格短注释。内部辅助函数不加注释——函数名表达用途。

### loading 选择

- 全局遮罩 → `withLoading(promise, '文案')`
- 按钮/表单内联 → `mutation.isPending`

二选一，不混用。

## Mock

Mock 由 `vite.config.ts` 的 `__USE_MOCK__` 构建期变量控制。启用时 `src/mock/index.ts` 动态注册 `axios-mock-adapter` 拦截 `src/utils/http` 实例，在 HTTP 适配层拦截响应（非页面直接设置 mock token）。

`src/mock/utils.ts` 导出 `makeResp(msg, code, total)` 构造标准 ApiResponse。

## Git 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：`<type>: <中文描述>`。type 可选 `feat`、`fix`、`refactor`、`perf`、`style`、`test`、`docs`、`chore`、`ci`。重要修改放前，文档等放后。
