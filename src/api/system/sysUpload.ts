import { apiPost } from '@/utils/http'

// ==================== Types ====================

/** 组织树节点（部门 type=1 / 用户 type=2） */
export interface uploadFileEntity {
  id: string
  newName: string
  oldName: string
  url: string
}

export function uploadFileApi(data: FormData) {
  return apiPost<uploadFileEntity>('/SysUpload/UploadFile', data)
}
