<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery, keepPreviousData } from '@tanstack/vue-query'
import ProTable from '@/components/ProTable/index.vue'
import type { ProTableColumn } from '@/components/ProTable/index.vue'
import type { LogListItem } from '@/api/system/sysLog'
import { logKeys } from '@/api/system/sysLog'
import * as sysLogApi from '@/api/system/sysLog'

const searchKey = ref('')
const pageIndex = ref(1)
const pageSize = ref(10)

const dateRange = ref<[string, string] | null>(null)

const { data: listRes, isFetching: loading } = useQuery({
  queryKey: [...logKeys.lists(), pageIndex, pageSize, searchKey, dateRange],
  queryFn: ({ signal }) =>
    sysLogApi.fetchLogList(
      {
        page: pageIndex.value,
        rows: pageSize.value,
        searchKey: searchKey.value || undefined,
        startTime: dateRange.value?.[0] || undefined,
        endTime: dateRange.value?.[1] || undefined,
      },
      signal,
    ),
  placeholderData: keepPreviousData,
})

const tableData = computed(() => listRes.value?.data ?? [])
const total = computed(() => listRes.value?.total ?? 0)

const columns: ProTableColumn<LogListItem>[] = [
  { prop: 'actionName', label: '操作名称', minWidth: 120, showOverflowTooltip: true },
  { prop: 'url', label: '接口地址', minWidth: 220, showOverflowTooltip: true },
  { prop: 'method', label: '请求类型', align: 'center', width: 100 },
  { prop: 'statusCode', label: '状态码', align: 'center', width: 90, slot: 'statusCode' },
  { prop: 'ipAddress', label: '客户端IP', align: 'center', minWidth: 150 },
  { prop: 'userName', label: '调用人员', align: 'center', width: 110 },
  { prop: 'createTime', label: '请求时间', align: 'center', width: 170 },
  { prop: 'elapsed', label: '请求响应时长(ms)', align: 'center', width: 150 },
]

const disabledDate = (date: Date) => date.getTime() > Date.now()

/** 查询 */
function handleSearch() {
  pageIndex.value = 1
}

/** 重置 */
function handleReset() {
  searchKey.value = ''
  dateRange.value = null
  pageIndex.value = 1
}
</script>

<template>
  <div class="space-y-4">
    <!-- 搜索筛选区 -->
    <div class="rounded bg-white p-5 shadow-sm">
      <el-form class="g-filter-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="搜索条件">
              <el-input
                v-model="searchKey"
                placeholder="请输入搜索条件"
                clearable
                @keyup.enter="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :disabled-date="disabledDate"
                :editable="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item>
              <div class="flex justify-end gap-2 w-full">
                <el-button type="primary" @click="handleSearch">
                  <template #icon><IconEpSearch /></template>
                  查询
                </el-button>
                <el-button @click="handleReset">
                  <template #icon><IconEpRefresh /></template>
                  重置
                </el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <!-- 表格区 -->
    <div class="rounded bg-white p-5 shadow-sm">
      <ProTable
        v-model:current-page="pageIndex"
        v-model:page-size="pageSize"
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :total="total"
        paginated
      >
        <template #statusCode="{ row }">
          <el-tag :type="row.statusCode >= 200 && row.statusCode < 300 ? 'success' : 'danger'">
            {{ row.statusCode }}
          </el-tag>
        </template>
      </ProTable>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
