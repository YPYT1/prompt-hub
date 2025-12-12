'use client'

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Prompt, Tag } from '@/lib/types'
import { Modal, Button, Input, Textarea, MultiSelect, useToast } from '@/components/ui'

interface PromptFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (prompt: Prompt) => void
  prompt?: Prompt | null
  tags: Tag[]
}

export function PromptForm({ isOpen, onClose, onSubmit, prompt, tags }: PromptFormProps) {
  const toast = useToast()
  const isEditing = !!prompt

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    description: '',
    tags: [] as string[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 初始化表单数据
  useEffect(() => {
    if (prompt) {
      setFormData({
        title: prompt.title,
        content: prompt.content,
        description: prompt.description || '',
        tags: prompt.tags,
      })
    } else {
      setFormData({
        title: '',
        content: '',
        description: '',
        tags: [],
      })
    }
    setErrors({})
  }, [prompt, isOpen])

  // 验证表单
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '请输入标题'
    } else if (formData.title.length > 100) {
      newErrors.title = '标题不能超过100个字符'
    }

    if (!formData.content.trim()) {
      newErrors.content = '请输入提示词内容'
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
      const newPrompt: Prompt = {
        id: prompt?.id || uuidv4(),
        title: formData.title.trim(),
        content: formData.content.trim(),
        description: formData.description.trim() || undefined,
        tags: formData.tags,
        isFavorite: prompt?.isFavorite || false,
        usageCount: prompt?.usageCount || 0,
        versions: isEditing
          ? [
              {
                id: uuidv4(),
                content: formData.content.trim(),
                createdAt: now,
              },
              ...prompt.versions,
            ]
          : [
              {
                id: uuidv4(),
                content: formData.content.trim(),
                createdAt: now,
              },
            ],
        createdAt: prompt?.createdAt || now,
        updatedAt: now,
      }

      await onSubmit(newPrompt)
      toast.success(isEditing ? '提示词已更新' : '提示词已创建')
      onClose()
    } catch {
      toast.error('操作失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 标签选项
  const tagOptions = tags.map((tag) => ({
    value: tag.id,
    label: tag.name,
    icon: (
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: tag.color }}
      />
    ),
  }))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '编辑提示词' : '新建提示词'}
      description={isEditing ? '修改提示词内容，将自动保存历史版本' : '创建一个新的提示词'}
      size="lg"
    >
      <div className="space-y-5">
        {/* 标题 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            标题 <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="输入提示词标题"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
          />
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            描述
          </label>
          <Input
            placeholder="简要描述这个提示词的用途（可选）"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* 内容 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            提示词内容 <span className="text-red-500">*</span>
          </label>
          <Textarea
            placeholder="输入提示词内容..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            error={errors.content}
            className="min-h-[200px]"
          />
        </div>

        {/* 标签 */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            标签
          </label>
          <MultiSelect
            values={formData.tags}
            onChange={(values) => setFormData({ ...formData, tags: values })}
            options={tagOptions}
            placeholder="选择标签（可多选）"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            {isEditing ? '保存更改' : '创建提示词'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
