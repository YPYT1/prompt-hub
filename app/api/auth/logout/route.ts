import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/session";

export async function POST() {
  try {
    await deleteSession();

    return NextResponse.json({
      success: true,
      message: "已退出登录",
    });
  } catch (error) {
    console.error("退出登录失败:", error);
    return NextResponse.json(
      { success: false, error: "退出登录失败" },
      { status: 500 }
    );
  }
}
