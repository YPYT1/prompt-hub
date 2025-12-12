'use client'

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Tag } from '@/lib/types'
import { Modal, Button, Input, Select, useToast } from '@/components/ui'
import { generateRandomColor } from '@/lib/utils'

// 预设颜色
const presetColors = [
  '#8b5cf6', // 紫色
  '#06b6d4', // 青色
  '#10b981', // 绿色
  '#f59e0b', // 琥珀
  '#ef4444', // 红色
  '#ec4899', // 粉色
  '#3b82f6', // 蓝色
  '#f97316', // 橙色
  '#a855f7', // 亮紫
  '#14b8a6', // 蓝绿
  '#6366f1', // 靛蓝
  '#84cc16', // 青柠
]

// 预设分组
const presetGroups = ['技术', '通用', '创意', '学习', '工作', '生活']

interface TagFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (tag: Tag) => void
  tag?: Tag | null
  parentTags: Tag[]
}

export function TagForm({ isOpen, onClose, onSubmit, tag, parentTags }: TagFormProps) {
  const toast = useToast()
  const isEditing = !!tag

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    color: presetColors[0],
    parentId: '',
    group: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 初始化表单数据
  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name,
        color: tag.color,
        parentId: tag.parentId || '',
        group: tag.group || '',
      })
    } else {
      setFormData({
        name: '',
        color: generateRandomColor(),
        parentId: '',
        group: '',
      })
    }
    setErrors({})
  }, [tag, isOpen])

  // 验证表单
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '请输入标签名称'
    } else if (formData.name.length > 20) {
      newErrors.name = '标签名称不能超过20个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const now = new Date().toISOString()
      const newTag: Tag = {
        id: tag?.id || uuidv4(),
        name: formData.name.trim(),
        color: formData.color,
        parentId: formData.parentId || undefined,
        group: formData.group || undefined,
        order: tag?.order || 0,
        usageCount: tag?.usageCount || 0,
        createdAt: tag?.createdAt || now,
      }

      await onSubmit(newTag)
      toast.success(isEditing ? '标签已更新' : '标签已创建')
      onClose()
    } catch {
      toast.error('操作失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 父标签选项
  const parentOptions = [
    { value: '', label: '无父标签' },
    ...parentTags
      .filter((t) => t.id !== tag?.id)
      .map((t) => ({
        value: t.id,
        label: t.name,
        icon: (
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: t.color }}
          />
        ),
      })),
  ]

  // 分组选项
  const groupOptions = [
    { value: '', label: '无分组' },
    ...presetGroups.map((g) => ({ value: g, label: g })),
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '编辑标签' : '新建标签'}
      description={isEditing ? '修改标签信息' : '创建一个新的标签'}
      size="md"
    >
      <div className="space-y-5">
        {/* 名称 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            标签名称 <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="输入标签名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />
        </div>

        {/* 颜色 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            标签颜色
          </label>
          <div className="flex flex-wrap gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-8 h-8 rounded-full transition-all ${
                  formData.color === color
                    ? 'ring-2 ring-offset-2 ring-offset-background scale-110'
                    : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: color,
                  ...(formData.color === color && { ringColor: color }),
                }}
              />
            ))}
          </div>

          {/* 自定义颜色 */}
          <div className="mt-3 flex items-center gap-2">
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="h-8 w-8 rounded cursor-pointer"
            />
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="flex-1 font-mono text-sm"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* 父标签 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            父标签
          </label>
          <Select
            value={formData.parentId}
            onChange={(value) => setFormData({ ...formData, parentId: value })}
            options={parentOptions}
            placeholder="选择父标签（可选）"
          />
        </div>

        {/* 分组 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            标签分组
          </label>
          <Select
            value={formData.group}
            onChange={(value) => setFormData({ ...formData, group: value })}
            options={groupOptions}
            placeholder="选择分组（可选）"
          />
        </div>

        {/* 预览 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            预览效果
          </label>
          <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
              style={{
                backgroundColor: `${formData.color}20`,
                color: formData.color,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: formData.color }}
              />
              {formData.name || '标签名称'}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            {isEditing ? '保存更改' : '创建标签'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
