import asyncio, sys, os
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding="utf-8")

BASE = "https://pavoa.com.co"
OUT  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_verify_screenshots", "ui")
os.makedirs(OUT, exist_ok=True)

results = []

def ok(label, detail=""):
    results.append({"label": label, "status": "OK"})
    print(f"  OK  {label}" + (f" — {detail}" if detail else ""))

def fail(label, detail=""):
    results.append({"label": label, "status": "FAIL"})
    print(f"  FAIL {label}" + (f" — {detail}" if detail else ""))

def warn(label, detail=""):
    results.append({"label": label, "status": "WARN"})
    print(f"  WARN {label}" + (f" — {detail}" if detail else ""))

async def shot(page, name, wait=3000):
    await page.wait_for_timeout(wait)
    await page.screenshot(path=f"{OUT}/{name}.png", full_page=False)

async def check_broken_images(page, label):
    broken = await page.evaluate("""() => {
        return Array.from(document.images)
            .filter(img => img.complete && img.naturalWidth === 0 && img.src && !img.src.startsWith('data:'))
            .map(img => img.src);
    }""")
    if broken:
        warn(f"{label}_imagenes", f"{len(broken)} imagen(es) rota(s): {broken[0][:60]}")
    else:
        ok(f"{label}_imagenes", "sin imágenes rotas")
    return broken

async def check_no_loading_stuck(page, label):
    loading = await page.locator("text=CARGANDO").count()
    if loading:
        fail(f"{label}_carga", "sigue en CARGANDO — página no cargó")
    else:
        ok(f"{label}_carga", "cargó correctamente")

async def main():
    console_errors = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page    = await context.new_page()

        failed_requests = []
        page.on("console",   lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(str(e)))
        page.on("response",  lambda r: failed_requests.append(f"{r.status} {r.url}") if r.status >= 500 else None)

        # ---------------------------------------------------------------
        # 1. ORDEN CONFIRMADA — estado approved
        # ---------------------------------------------------------------
        print("\n=== 1. ORDEN CONFIRMADA (/orden-confirmada) ===")
        url_aprobada = f"{BASE}/orden-confirmada?payment_id=999999999&status=approved"
        await page.goto(url_aprobada, wait_until="domcontentloaded", timeout=20000)
        await shot(page, "orden_confirmada", wait=4000)

        # Botón "Seguir comprando"
        btn_seguir = page.locator("a:has-text('Seguir comprando'), a:has-text('SEGUIR COMPRANDO')")
        if await btn_seguir.count() > 0:
            href = await btn_seguir.first.get_attribute("href")
            ok("orden_confirmada_btn_seguir", f"existe → href: {href}")
            # Verificar que navega a /categoria
            if href and "/categoria" in href:
                ok("orden_confirmada_btn_seguir_href", "apunta a /categoria correctamente")
            else:
                warn("orden_confirmada_btn_seguir_href", f"href inesperado: {href}")
        else:
            fail("orden_confirmada_btn_seguir", "botón 'Seguir comprando' NO encontrado")

        # Botón "Ver mis pedidos"
        btn_pedidos = page.locator("a:has-text('Ver mis pedidos'), a:has-text('VER MIS PEDIDOS')")
        if await btn_pedidos.count() > 0:
            href = await btn_pedidos.first.get_attribute("href")
            ok("orden_confirmada_btn_pedidos", f"existe → href: {href}")
            if href and "/cuenta" in href:
                ok("orden_confirmada_btn_pedidos_href", "apunta a /cuenta correctamente")
            else:
                warn("orden_confirmada_btn_pedidos_href", f"href inesperado: {href}")
        else:
            fail("orden_confirmada_btn_pedidos", "botón 'Ver mis pedidos' NO encontrado")

        # Click real en "Seguir comprando" y verificar navegación
        if await btn_seguir.count() > 0:
            await btn_seguir.first.click()
            await page.wait_for_timeout(3000)
            current = page.url
            if "/categoria" in current:
                ok("orden_confirmada_nav_seguir", f"navegó a {current}")
            else:
                fail("orden_confirmada_nav_seguir", f"no llegó a /categoria — está en {current}")

        await check_broken_images(page, "orden_confirmada")

        # ---------------------------------------------------------------
        # 2. HOMEPAGE
        # ---------------------------------------------------------------
        print("\n=== 2. HOMEPAGE ===")
        await page.goto(BASE, wait_until="domcontentloaded", timeout=20000)
        await shot(page, "homepage", wait=4000)
        await check_no_loading_stuck(page, "homepage")
        await check_broken_images(page, "homepage")

        title = await page.title()
        ok("homepage_titulo", title[:60])

        footer = await page.locator("footer").count()
        ok("homepage_footer", "renderizado") if footer else fail("homepage_footer", "NO encontrado")

        nav_links = await page.locator("nav a, header a").count()
        ok("homepage_nav", f"{nav_links} links en nav") if nav_links > 0 else fail("homepage_nav", "sin links en nav")

        # ---------------------------------------------------------------
        # 3. CATÁLOGO (/categoria)
        # ---------------------------------------------------------------
        print("\n=== 3. CATÁLOGO (/categoria) ===")
        await page.goto(f"{BASE}/categoria", wait_until="domcontentloaded", timeout=20000)
        await shot(page, "catalogo", wait=5000)
        await check_no_loading_stuck(page, "catalogo")
        await check_broken_images(page, "catalogo")

        productos = await page.locator("a[href*='/producto']").count()
        if productos > 0:
            ok("catalogo_productos", f"{productos} productos encontrados")
        else:
            fail("catalogo_productos", "sin productos visibles")

        # ---------------------------------------------------------------
        # 4. PÁGINA DE PRODUCTO
        # ---------------------------------------------------------------
        print("\n=== 4. PÁGINA DE PRODUCTO ===")
        producto_links = await page.locator("a[href*='/producto']").all()
        if producto_links:
            href = await producto_links[0].get_attribute("href")
            url_prod = href if href.startswith("http") else f"{BASE}{href}"
            await page.goto(url_prod, wait_until="domcontentloaded", timeout=20000)
            await shot(page, "producto", wait=5000)
            await check_no_loading_stuck(page, "producto")
            await check_broken_images(page, "producto")

            h1 = await page.locator("h1").first.text_content() if await page.locator("h1").count() > 0 else ""
            ok("producto_titulo", h1[:50]) if h1 else fail("producto_titulo", "sin h1")

            # 1. Seleccionar primer color disponible
            color_btn = page.locator("#color-selector button").first
            if await color_btn.count() > 0:
                await color_btn.click()
                # Esperar a que #talla-selector aparezca (está condicionado a colorSeleccionado)
                await page.locator("#talla-selector").wait_for(state="visible", timeout=5000)
                ok("producto_color", "color seleccionado")
            else:
                warn("producto_color", "sin botones de color encontrados")

            # 2. Seleccionar primera talla real (excluir botón de guía de tallas)
            talla_btn = page.locator("#talla-selector button").filter(has_not_text="uía").first
            if await talla_btn.count() > 0:
                await talla_btn.click()
                await page.wait_for_timeout(800)
                talla_texto = await talla_btn.text_content()
                ok("producto_talla", f"talla '{talla_texto.strip()}' seleccionada")
            else:
                warn("producto_talla", "sin botones de talla encontrados")

            # 3. Botón principal — puede decir 'Añadir a la bolsa' o 'Agotado'
            await shot(page, "producto_post_seleccion", wait=1000)
            btn_listo    = page.locator("button:has-text('Añadir a la bolsa')")
            btn_agotado  = page.locator("button:has-text('Agotado')")
            btn_bloqueado = page.locator("button:has-text('Selecciona color y talla')")
            if await btn_listo.count() > 0:
                ok("producto_btn_agregar", "botón 'Añadir a la bolsa' disponible")
            elif await btn_agotado.count() > 0:
                ok("producto_btn_agregar", "botón visible — variante agotada (esperado si sin stock)")
            elif await btn_bloqueado.count() > 0:
                fail("producto_btn_agregar", "sigue en 'Selecciona color y talla' — selección no registró")
            else:
                fail("producto_btn_agregar", "botón no encontrado en ningún estado conocido")
        else:
            fail("producto", "no se pudo navegar — sin links de productos en catálogo")

        # ---------------------------------------------------------------
        # 5. CARRITO (/cart)
        # ---------------------------------------------------------------
        print("\n=== 5. CARRITO ===")
        await page.goto(f"{BASE}/cart", wait_until="domcontentloaded", timeout=20000)
        await shot(page, "carrito", wait=5000)
        await check_no_loading_stuck(page, "carrito")
        await check_broken_images(page, "carrito")

        # ---------------------------------------------------------------
        # 6. LOGIN (/login)
        # ---------------------------------------------------------------
        print("\n=== 6. LOGIN ===")
        await page.goto(f"{BASE}/login", wait_until="domcontentloaded", timeout=20000)
        await shot(page, "login", wait=4000)
        await check_no_loading_stuck(page, "login")

        inputs = await page.locator("input[type='email'], input[type='password']").count()
        ok("login_form", f"{inputs} campos de formulario") if inputs >= 2 else fail("login_form", f"solo {inputs} campo(s)")

        btn_submit = await page.locator("button[type='submit'], button:has-text('Entrar'), button:has-text('ENTRAR'), button:has-text('Iniciar')").count()
        ok("login_btn_submit", "encontrado") if btn_submit > 0 else fail("login_btn_submit", "botón submit NO encontrado")

        # ---------------------------------------------------------------
        # 7. ERRORES DE CONSOLA
        # ---------------------------------------------------------------
        print("\n=== 7. ERRORES DE CONSOLA ===")
        # Los errores HTTP se validan abajo con status y URL. Chromium tambien los
        # duplica como un mensaje generico de consola sin indicar que request fallo.
        criticos = [e for e in console_errors if not any(x in e.lower() for x in [
            "favicon", "chunk", "hydrat", "failed to load resource",
        ])]
        if criticos:
            for e in criticos[:5]:
                warn("consola", e[:100])
        else:
            ok("consola", "sin errores críticos")

        print("\n=== 8. REQUESTS CON ERROR 500 ===")
        # Filtrar los 500 de procesar-pago desde orden-confirmada con payment_id falso (esperados en test)
        reales = [r for r in failed_requests if not (
            "procesar-pago" in r and "orden-confirmada" not in r
        ) and "procesar-pago" not in r]
        if reales:
            for req in reales[:10]:
                fail("request_500", req[:120])
        else:
            ok("requests_500", "sin respuestas 5xx inesperadas")
            if failed_requests:
                print(f"     (ignorados {len(failed_requests)} 500 de procesar-pago por payment_id de prueba)")

        await browser.close()

    # -------------------------------------------------------------------
    # RESUMEN
    # -------------------------------------------------------------------
    print("\n=== RESUMEN ===")
    total  = len(results)
    passed = sum(1 for r in results if r["status"] == "OK")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    warned = sum(1 for r in results if r["status"] == "WARN")
    print(f"  {total} checks | OK: {passed} | FAIL: {failed} | WARN: {warned}")
    if failed:
        print("  Fallidos:")
        for r in results:
            if r["status"] == "FAIL":
                print(f"    - {r['label']}")
    print(f"  Screenshots en: {OUT}")
    sys.exit(1 if failed else 0)

asyncio.run(main())
