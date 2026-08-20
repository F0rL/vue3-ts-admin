import { config } from '@/config'
import type { UploadRawFile } from 'element-plus'
import { message } from '@/utils/feedback'

/** 将后端返回的相对路径拼接为完整 URL；http(s)/协议相对/data/blob 地址原样返回 */
export function resolveFileUrl(url?: string | null): string {
  if (!url) return ''
  if (/^(https?:)?\/\//.test(url) || /^(data|blob):/.test(url)) return url
  return config.FILE_BASE_URL + url
}

/** 允许上传的图片 MIME 类型 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/bmp']

/** 最大文件大小（MB） */
const MAX_IMAGE_SIZE_MB = 2

/**
 * 校验图片上传文件：格式 + 大小。
 * 校验失败时自动弹出错误提示并返回 false，成功返回 true。
 */
export function validateImageFile(file: UploadRawFile): boolean {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    message.error('只支持 jpg/jpeg/png/bmp 格式')
    return false
  }
  if (file.size / 1024 / 1024 > MAX_IMAGE_SIZE_MB) {
    message.error('图片大小不能超过 2MB')
    return false
  }
  return true
}
