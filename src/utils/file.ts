import { config } from '@/config'

/** 将后端返回的相对路径拼接为完整 URL；http(s)/协议相对/data/blob 地址原样返回 */
export function resolveFileUrl(url?: string | null): string {
  if (!url) return ''
  if (/^(https?:)?\/\//.test(url) || /^(data|blob):/.test(url)) return url
  return config.FILE_BASE_URL + url
}
