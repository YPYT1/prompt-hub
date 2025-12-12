// 提示词版本
export interface PromptVersion {
  id: string
  content: string
  createdAt: string
}

// 提示词
export interface Prompt {
  id: string
  title: string
  content: string
  description?: string
  tags: string[]
  isFavorite: boolean
  usageCount: number
  versions: PromptVersion[]
  createdAt: string
  updatedAt: string
}

// 标签
export interface Tag {
  id: string
  name: string
  color: string
  parentId?: string
  group?: string
  order: number
  usageCount: number
  createdAt: string
}

// 标签分组
export interface TagGroup {
  id: string
  name: string
  order: number
}

// API 响应
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 排序选项
export type SortOption = 'time' | 'name' | 'usage'
export type SortOrder = 'asc' | 'desc'

// 筛选选项
export interface FilterOptions {
  search: string
  tags: string[]
  favorite: boolean | null
  sortBy: SortOption
  sortOrder: SortOrder
}
