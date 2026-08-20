import { apiGet } from '@/utils/http'

// ==================== Types ====================

export interface LogListItem {
  /** 日志 ID */
  id: string
  /** 控制器名称 */
  controller: string
  /** 请求动作 */
  action: string
  /** 操作名称 */
  actionName: string
  /** 动作类型 */
  actionType: string
  /** 来源 */
  source: string
  /** 请求 Host */
  host: string
  /** 接口地址 */
  url: string
  /** 请求类型 */
  method: string
  /** 浏览器 UA */
  userAgent: string
  /** 查询字符串 */
  queryString: string
  /** 请求体 */
  body: string
  /** 状态码 */
  statusCode: number
  /** 响应内容 */
  message: string
  /** 客户端 IP */
  ipAddress: string
  /** 用户类型 */
  userType: number
  /** 用户 ID */
  userId: string
  /** 用户名称 */
  userName: string
  /** 请求时间 */
  createTime: string
  /** 请求响应时长（毫秒） */
  elapsed: number
}

export interface LogListParams {
  page: number
  rows: number
  searchKey?: string
  startTime?: string
  endTime?: string
}

export function fetchLogList(params?: LogListParams, signal?: AbortSignal) {
  return apiGet<LogListItem[]>('/SysLog/GetListHttpLog', { params, signal })
}

export const logKeys = {
  all: ['logs'] as const,
  lists: () => [...logKeys.all, 'list'] as const,
}
