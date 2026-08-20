import type MockAdapter from 'axios-mock-adapter'
import { makeResp } from '../utils'
import type { LogListItem } from '@/api/system/sysLog'

const methods = ['GET', 'POST', 'PUT', 'DELETE']
const actions = [
  { controller: '系统管理', actionName: '菜单列表', url: '/api/SysMenu/GetMenuList' },
  { controller: '系统管理', actionName: '菜单树', url: '/api/SysMenu/GetMenuTree' },
  { controller: '系统管理', actionName: '角色列表', url: '/api/SysRole/GetRoleList' },
  { controller: '系统管理', actionName: '用户列表', url: '/api/SysUser/GetUserList' },
  { controller: '系统管理', actionName: '组织架构', url: '/api/SysOrg/GetDepartmentTree' },
  { controller: '系统管理', actionName: '日志列表', url: '/api/SysLog/GetListHttpLog' },
  { controller: '系统管理', actionName: '创建用户', url: '/api/SysUser/CreateUser' },
  { controller: '系统管理', actionName: '更新角色', url: '/api/SysRole/UpdateRole' },
  { controller: '系统管理', actionName: '删除菜单', url: '/api/SysMenu/DeleteMenu' },
  { controller: '系统管理', actionName: '重置密码', url: '/api/SysUser/ResetPwd' },
]

const hosts = ['43.142.111.195:89', '192.168.1.100', '10.0.0.5', '172.16.0.1']
const ips = ['::ffff:27.19.162.115', '::ffff:10.0.0.8', '::ffff:172.16.0.3', '::ffff:192.168.1.66']

const users = [
  { userId: 'SysAdmin0808', userName: '超级管理员' },
  { userId: 'zhangsan', userName: '张三' },
  { userId: 'lisi', userName: '李四' },
  { userId: 'wangwu', userName: '王五' },
  { userId: 'zhaoliu', userName: '赵六' },
]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function randomTime(today: Date): string {
  const h = randomInt(0, 23)
  const m = randomInt(0, 59)
  const s = randomInt(0, 59)
  return `${today.getFullYear()}/${pad(today.getMonth() + 1)}/${pad(today.getDate())} ${pad(h)}:${pad(m)}:${pad(s)}`
}

function generateLogs(): LogListItem[] {
  const today = new Date()
  const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'

  return Array.from({ length: 38 }, (_, i) => {
    const method = randomItem(methods)
    const action = randomItem(actions)
    const user = randomItem(users)

    return {
      id: String(800 + i),
      controller: action.controller,
      action: method,
      actionName: action.actionName,
      actionType: 'Internal',
      source: 'Platform.WebApi',
      host: randomItem(hosts),
      url: action.url,
      method,
      userAgent: USER_AGENT,
      queryString: '',
      body: '',
      statusCode: randomItem([200, 200, 200, 400, 500]),
      message: '',
      ipAddress: randomItem(ips),
      userType: 10,
      userId: user.userId,
      userName: user.userName,
      createTime: randomTime(today),
      elapsed: randomInt(5, 2800),
    }
  })
}

const logs = generateLogs()

export function registerSysLogMock(mock: MockAdapter) {
  mock.onGet('/api/SysLog/GetListHttpLog').reply(config => {
    const params = config.params || {}
    const searchKey = ((params.searchKey as string) || '').toLowerCase()
    const startTime = (params.startTime as string) || ''
    const endTime = (params.endTime as string) || ''

    let filtered = [...logs]

    if (searchKey) {
      filtered = filtered.filter(
        l =>
          l.actionName.toLowerCase().includes(searchKey) ||
          l.url.toLowerCase().includes(searchKey) ||
          l.method.toLowerCase().includes(searchKey) ||
          l.host.toLowerCase().includes(searchKey) ||
          l.userName.toLowerCase().includes(searchKey),
      )
    }

    if (startTime) {
      filtered = filtered.filter(l => l.createTime.replace(/\//g, '-') >= startTime.replace(/\//g, '-'))
    }
    if (endTime) {
      const end = endTime.length === 10 ? `${endTime} 23:59:59` : endTime
      filtered = filtered.filter(l => l.createTime.replace(/\//g, '-') <= end.replace(/\//g, '-'))
    }

    const pageIndex = Number(params.page) || 1
    const pageSize = Number(params.rows) || 10
    const total = filtered.length
    const start = (pageIndex - 1) * pageSize
    const page = filtered.slice(start, start + pageSize)

    return [200, makeResp(page, 0, total)]
  })
}