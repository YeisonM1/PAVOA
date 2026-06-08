import asyncio, sys, os
from playwright.async_api import async_playwright
sys.stdout.reconfigure(encoding="utf-8")

BASE = "https://pavoa.com.co"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_verify_screenshots")
os.makedirs(OUT, exist_ok=True)

async def shot(page, name, wait=4000):
    await page.wait_for_timeout(wait)
    await page.screenshot(path=f"{OUT}/{name}.png", full_page=False)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print("=== CATALOGO (/categoria) ===")
        await page.goto(f"{BASE}/categoria", wait_until="domcontentloaded", timeout=20000)
        await shot(page, "categoria", wait=5000)
        products = await page.locator("a[href*='/producto']").all()
        print(f"  Productos encontrados: {len(products)}")
        if products:
            href = await products[0].get_attribute("href")
            print(f"  Primer producto: {href}")

        print("\n=== PRODUCTO INDIVIDUAL ===")
        await page.goto(f"{BASE}/producto/aura-one-piece", wait_until="domcontentloaded", timeout=20000)
        await shot(page, "producto", wait=5000)
        atc = page.locator("button:has-text('Agregar'), button:has-text('agregar'), button:has-text('AGREGAR'), button:has-text('Comprar'), button:has-text('COMPRAR')")
        atc_count = await atc.count()
        print(f"  Boton agregar al carrito: {'SI' if atc_count > 0 else 'NO encontrado'}")
        title = await page.locator("h1").first.text_content() if await page.locator("h1").count() > 0 else "no h1"
        print(f"  Titulo producto: {title}")

        print("\n=== CARRITO (vacio) ===")
        await page.goto(f"{BASE}/cart", wait_until="domcontentloaded", timeout=20000)
        await shot(page, "carrito2", wait=6000)
        loading = await page.locator("text=CARGANDO").count()
        print(f"  Sigue en CARGANDO: {'SI - PROBLEMA' if loading > 0 else 'NO - cargo correctamente'}")

        print("\n=== LOGIN ===")
        await page.goto(f"{BASE}/login", wait_until="domcontentloaded", timeout=20000)
        await shot(page, "login2", wait=6000)
        loading = await page.locator("text=CARGANDO").count()
        form = await page.locator("input[type='email'], input[type='password']").count()
        print(f"  Sigue en CARGANDO: {'SI - PROBLEMA' if loading > 0 else 'NO'}")
        print(f"  Campos de formulario: {form}")

        print("\n=== FOOTER (carga global) ===")
        await page.goto(BASE, wait_until="domcontentloaded", timeout=20000)
        await shot(page, "footer", wait=6000)
        footer = await page.locator("footer").count()
        footer_links = await page.locator("footer a").count()
        print(f"  Footer renderizado: {'SI' if footer > 0 else 'NO'}")
        print(f"  Links en footer: {footer_links}")

        await browser.close()

asyncio.run(main())
