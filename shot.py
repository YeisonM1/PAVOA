import asyncio
from playwright.async_api import async_playwright

async def shot():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width':800,'height':800})
        await page.goto('file:///C:/Users/yuram/Projects/PAVOA/test_email.html')
        await page.wait_for_timeout(1000)
        await page.screenshot(path='CAPS/email-cancelado-actual.png', full_page=True)
        await browser.close()

asyncio.run(shot())
