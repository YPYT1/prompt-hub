import { promises as fs } from "fs";
import path from "path";
import { Prompt, Tag } from "@/lib/types";

// 数据文件路径
const DATA_DIR = path.join(process.cwd(), "data");
const PROMPTS_FILE = path.join(DATA_DIR, "prompts.json");
const TAGS_FILE = path.join(DATA_DIR, "tags.json");

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// 读取提示词数据
export async function readPrompts(): Promise<Prompt[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(PROMPTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    // 文件不存在时返回空数组
    return [];
  }
}

// 写入提示词数据
export async function writePrompts(prompts: Prompt[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(PROMPTS_FILE, JSON.stringify(prompts, null, 2), "utf-8");
}

// 读取标签数据
export async function readTags(): Promise<Tag[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(TAGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    // 文件不存在时返回空数组
    return [];
  }
}

// 写入标签数据
export async function writeTags(tags: Tag[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(TAGS_FILE, JSON.stringify(tags, null, 2), "utf-8");
}

// 更新标签使用次数
export async function updateTagUsageCount(tagIds: string[]): Promise<void> {
  const tags = await readTags();
  const updatedTags = tags.map((tag) => {
    if (tagIds.includes(tag.id)) {
      return { ...tag, usageCount: tag.usageCount + 1 };
    }
    return tag;
  });
  await writeTags(updatedTags);
}
