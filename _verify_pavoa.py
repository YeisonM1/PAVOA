import asyncio, sys
from playwright.async_api import async_playwright
import os, json
sys.stdout.reconfigure(encoding="utf-8")

BASE = "https://pavoa.com.co"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_verify_screenshots")
os.makedirs(OUT, exist_ok=True)

results = []

async def check(page, label, url=None, action=None, screenshot=True):
    try:
        if url:
            await page.goto(url, wait_until="domcontentloaded", timeout=20000)
        if action:
            await action()
        await page.wait_for_timeout(1500)
        errors = []
        # Capture console errors
        status = "OK"
        if screenshot:
            path = f"{OUT}/{label.replace(' ', '_')}.png"
            await page.screenshot(path=path, full_page=False)
        results.append({"label": label, "status": status, "url": page.url})
        print(f"  ✅ {label} — {page.url}")
    except Exception as e:
        results.append({"label": label, "status": "ERROR", "error": str(e)})
        print(f"  ❌ {label} — ERROR: {e}")

async def main():
    console_errors = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(f"[PAGE ERROR] {err}"))

        print("\n=== 1. HOMEPAGE ===")
        await check(page, "homepage", url=BASE)
        title = await page.title()
        print(f"     Título: {title}")

        # Check nav links exist
        nav_links = await page.locator("nav a, header a").all()
        print(f"     Links en nav: {len(nav_links)}")

        print("\n=== 2. CATALOGO / PRODUCTOS ===")
        # Try common catalog paths
        for path in ["/coleccion", "/collections", "/catalogo", "/tienda", "/shop", "/collections/all"]:
            try:
                resp = await page.goto(f"{BASE}{path}", wait_until="domcontentloaded", timeout=8000)
                if resp and resp.status < 400:
                    await page.wait_for_timeout(2000)
                    await page.screenshot(path=f"{OUT}/catalogo.png")
                    print(f"  ✅ Catálogo en {BASE}{path} — status {resp.status}")
                    results.append({"label": "catalogo", "status": "OK", "url": page.url})
                    break
            except:
                continue

        # Look for product cards
        product_cards = await page.locator("a[href*='/product'], a[href*='/producto'], a[href*='/collections/']").all()
        print(f"     Product links encontrados: {len(product_cards)}")

        # Try clicking first product
        print("\n=== 3. PAGINA DE PRODUCTO ===")
        product_url = None
        if product_cards:
            try:
                href = await product_cards[0].get_attribute("href")
                if href:
                    product_url = href if href.startswith("http") else f"{BASE}{href}"
            except:
                pass

        if product_url:
            await check(page, "producto_individual", url=product_url)
            # Check for add to cart button
            atc = page.locator("button:has-text('agregar'), button:has-text('Agregar'), button:has-text('Añadir'), button:has-text('comprar'), button:has-text('Comprar'), button[type='submit']")
            atc_count = await atc.count()
            print(f"     Botón agregar al carrito: {'encontrado' if atc_count > 0 else 'NO encontrado'}")
        else:
            print("  ⚠️  No se encontró link a producto individual desde catálogo")

        print("\n=== 4. CARRITO ===")
        for path in ["/cart", "/carrito"]:
            try:
                resp = await page.goto(f"{BASE}{path}", wait_until="domcontentloaded", timeout=8000)
                if resp and resp.status < 400:
                    await page.screenshot(path=f"{OUT}/carrito.png")
                    print(f"  ✅ Carrito en {BASE}{path}")
                    results.append({"label": "carrito", "status": "OK", "url": page.url})
                    break
            except:
                continue

        print("\n=== 5. NAVEGACION GENERAL ===")
        # Go back to home and collect all internal links
        await page.goto(BASE, wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(1500)
        all_links = await page.locator("a[href]").all()
        internal = []
        for link in all_links:
            try:
                href = await link.get_attribute("href")
                if href and (href.startswith("/") or BASE in href) and not href.startswith("#"):
                    internal.append(href)
            except:
                pass
        internal = list(set(internal))[:15]  # check up to 15
        print(f"     Links internos únicos: {len(internal)}")

        broken = []
        for href in internal:
            url = href if href.startswith("http") else f"{BASE}{href}"
            try:
                resp = await page.goto(url, wait_until="domcontentloaded", timeout=8000)
                code = resp.status if resp else 0
                if code >= 400:
                    broken.append(f"{href} → {code}")
                    print(f"  ❌ {href} → {code}")
                else:
                    print(f"  ✅ {href} → {code}")
            except Exception as e:
                broken.append(f"{href} → timeout/error")
                print(f"  ⚠️  {href} → {e}")

        print("\n=== 6. LOGIN / REGISTRO ===")
        for path, label in [("/login", "login"), ("/registro", "registro"), ("/account/login", "account_login"), ("/register", "register")]:
            try:
                resp = await page.goto(f"{BASE}{path}", wait_until="domcontentloaded", timeout=8000)
                if resp and resp.status < 400:
                    await page.screenshot(path=f"{OUT}/{label}.png")
                    print(f"  ✅ {label} en {BASE}{path}")
                    results.append({"label": label, "status": "OK", "url": page.url})
                    break
            except:
                continue

        print("\n=== ERRORES DE CONSOLA ===")
        critical = [e for e in console_errors if "chunk" not in e.lower() and "favicon" not in e.lower()]
        if critical:
            for e in critical[:10]:
                print(f"  ⚠️  {e}")
        else:
            print("  ✅ Sin errores críticos de consola")

        print(f"\n=== RESUMEN ===")
        print(f"  Screenshots guardados en: {OUT}")
        print(f"  Broken links: {broken if broken else 'ninguno'}")

        await browser.close()

asyncio.run(main())
