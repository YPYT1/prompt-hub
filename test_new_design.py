from playwright.sync_api import sync_playwright

def main():
    console_messages = []
    errors = []
    failed_requests = []

    with sync_playwright() as p:
        # 使用本地 Chrome 浏览器
        browser = p.chromium.launch(
            headless=False,
            executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe"
        )
        context = browser.new_context()
        context.clear_cookies()
        page = context.new_page()

        # 监听控制台消息
        def handle_console(msg):
            console_messages.append({
                'type': msg.type,
                'text': msg.text
            })
            if msg.type == 'error':
                errors.append(msg.text)

        page.on('console', handle_console)

        # 监听页面错误
        def handle_pageerror(error):
            errors.append(f"Page Error: {error}")

        page.on('pageerror', handle_pageerror)

        # 监听请求失败
        def handle_request_failed(request):
            failed_requests.append({
                'url': request.url,
                'failure': request.failure
            })

        page.on('requestfailed', handle_request_failed)

        print("正在访问 http://localhost:3001 ...")
        page.goto('http://localhost:3001', timeout=30000)

        print("等待页面加载完成...")
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)

        # 截图
        page.screenshot(path='D:/github_Repositories/pro/prompt-hub/new_design.png', full_page=True)
        print("截图已保存到 new_design.png")

        # 保持浏览器打开让用户查看
        print("\n浏览器将保持打开 15 秒供查看...")
        page.wait_for_timeout(15000)

        browser.close()

    # 输出结果
    print("\n" + "="*50)
    print("控制台错误")
    print("="*50)
    if errors:
        for err in errors:
            print(f"❌ {err}")
    else:
        print("✅ 没有控制台错误")

    print("\n" + "="*50)
    print("失败的请求")
    print("="*50)
    if failed_requests:
        for req in failed_requests:
            print(f"❌ {req['url']}")
    else:
        print("✅ 没有失败的请求")

if __name__ == '__main__':
    main()
