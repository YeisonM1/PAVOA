import sys, os, hmac, hashlib, time, uuid, json, subprocess
import requests

sys.stdout.reconfigure(encoding="utf-8")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
def load_env():
    env = {}
    path = os.path.join(os.path.dirname(__file__), ".env")
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env

ENV = load_env()
BASE                   = "https://pavoa.com.co"
SHOPIFY_DOMAIN         = ENV.get("SHOPIFY_DOMAIN", "pavoa-4502.myshopify.com")
SHOPIFY_ADMIN_TOKEN    = ENV.get("SHOPIFY_ADMIN_TOKEN", "")
SHOPIFY_STOREFRONT_TOKEN = ENV.get("VITE_SHOPIFY_TOKEN", "")
MP_WEBHOOK_SECRET      = ENV.get("MP_WEBHOOK_SECRET", "")
SHOPIFY_WEBHOOK_SECRET = ENV.get("SHOPIFY_WEBHOOK_SECRET", "")
MP_ACCESS_TOKEN        = ENV.get("MP_ACCESS_TOKEN", "")
RESEND_API_KEY         = ENV.get("RESEND_API_KEY", "")
VERIFY_EMAIL           = "gyeison184@gmail.com"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# 1. Obtener variante real de Shopify
# ---------------------------------------------------------------------------
def get_test_variant():
    query = """
    {
      products(first: 1) {
        edges {
          node {
            id title
            images(first: 1) { edges { node { url } } }
            variants(first: 1) {
              edges {
                node { id title availableForSale price { amount } }
              }
            }
          }
        }
      }
    }
    """
    r = requests.post(
        f"https://{SHOPIFY_DOMAIN}/api/2026-04/graphql.json",
        headers={
            "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
            "Content-Type": "application/json",
        },
        json={"query": query},
        timeout=10,
    )
    r.raise_for_status()
    data = r.json()
    product = data["data"]["products"]["edges"][0]["node"]
    variant = product["variants"]["edges"][0]["node"]
    images  = product["images"]["edges"]
    return {
        "product_gid":    product["id"],
        "variant_gid":    variant["id"],
        "variant_id":     int(variant["id"].split("/")[-1]),
        "price":          float(variant["price"]["amount"]),
        "name":           product["title"],
        "variant_title":  variant["title"],
        "image":          images[0]["node"]["url"] if images else "",
        "available":      variant["availableForSale"],
    }

# ---------------------------------------------------------------------------
# 2. Helpers de payload
# ---------------------------------------------------------------------------
def build_cart(v):
    return [{
        "producto": {
            "id":                  v["product_gid"],
            "nombre":              v["name"],
            "selectedVariantId":   v["variant_gid"],
            "colorSeleccionado":   "Negro",
            "precioNumerico":      v["price"],
            "imagen":              v["image"],
        },
        "talla":    v["variant_title"],
        "cantidad": 1,
    }]

TEST_FORM = {
    "nombre":    "Test Automatico",
    "email":     "test@pavoa.com.co",
    "telefono":  "3007056457",
    "direccion": "Calle 123 # 45-67",
    "barrio":    "Chapinero",
    "ciudad":    "Bogota",
    "horario":   "Manana",
    "referencia": "Script verificacion automatica",
}

# ---------------------------------------------------------------------------
# 3. Tests
# ---------------------------------------------------------------------------
def test_pedido(v):
    r = requests.post(f"{BASE}/api/pedido", json={
        "form":           TEST_FORM,
        "cartItems":      build_cart(v),
        "cartTotal":      v["price"],
        "idempotencyKey": f"verify-{uuid.uuid4()}",
    }, timeout=20)
    return r

def test_procesar_pago(draft_order_id, v):
    r = requests.post(f"{BASE}/api/procesar-pago", json={
        "form":           TEST_FORM,
        "cartItems":      build_cart(v),
        "cartTotal":      v["price"],
        "draftOrderId":   str(draft_order_id),
        "idempotencyKey": f"verify-pago-{uuid.uuid4()}",
    }, timeout=20)
    return r

def test_webhook():
    payment_id = "00000000001"
    request_id = str(uuid.uuid4())
    ts         = str(int(time.time() * 1000))
    template   = f"id:{payment_id};request-id:{request_id};ts:{ts};"
    sig        = hmac.new(MP_WEBHOOK_SECRET.encode(), template.encode(), hashlib.sha256).hexdigest()

    r = requests.post(
        f"{BASE}/api/webhook-mercadopago",
        json={"type": "payment", "data": {"id": payment_id}},
        headers={
            "x-signature":  f"ts={ts},v1={sig}",
            "x-request-id": request_id,
            "Content-Type": "application/json",
        },
        timeout=10,
    )
    return r

def test_contacto():
    r = requests.post(f"{BASE}/api/contacto", json={
        "type":   "newsletter-subscribe",
        "email":  "test-verify@pavoa.com.co",
        "source": "verify_script",
    }, timeout=10)
    return r

def test_descuento():
    r = requests.post(f"{BASE}/api/check-descuento", json={
        "email": "test@pavoa.com.co",
    }, timeout=10)
    return r

# ---------------------------------------------------------------------------
# Nuevos tests urgentes
# ---------------------------------------------------------------------------

def verify_draft_order_data(draft_order_id, variant):
    """Verifica que el draft order llegó a Shopify con los datos correctos."""
    r = requests.get(
        f"https://{SHOPIFY_DOMAIN}/admin/api/2026-04/draft_orders/{draft_order_id}.json",
        headers={"X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN},
        timeout=10,
    )
    r.raise_for_status()
    order = r.json()["draft_order"]
    issues = []

    got_email = order.get("email", "")
    if got_email.lower() != TEST_FORM["email"].lower():
        issues.append(f"email: esperado '{TEST_FORM['email']}', llegó '{got_email}'")

    addr = order.get("shipping_address") or {}
    got_first = addr.get("first_name", "")
    expected_first = TEST_FORM["nombre"].split()[0]
    if got_first.lower() != expected_first.lower():
        issues.append(f"nombre: esperado '{expected_first}', llegó '{got_first}'")

    got_addr = addr.get("address1", "")
    if TEST_FORM["direccion"].lower() not in got_addr.lower():
        issues.append(f"direccion: esperado '{TEST_FORM['direccion']}', llegó '{got_addr}'")

    items = order.get("line_items", [])
    if not items:
        issues.append("line_items: vacío en Shopify")
    else:
        item = items[0]
        if str(item.get("variant_id")) != str(variant["variant_id"]):
            issues.append(f"variant_id: esperado {variant['variant_id']}, llegó {item.get('variant_id')}")
        if int(item.get("quantity", 0)) != 1:
            issues.append(f"quantity: esperado 1, llegó {item.get('quantity')}")
        got_price = float(item.get("price", 0))
        if abs(got_price - variant["price"]) > 1:
            issues.append(f"precio item: esperado {variant['price']}, llegó {got_price}")

    return issues, order


def test_pedido_variante_invalida():
    """El sistema debe rechazar un carrito con variante que no existe."""
    r = requests.post(f"{BASE}/api/pedido", json={
        "form":           TEST_FORM,
        "cartItems": [{
            "producto": {
                "id":                "gid://shopify/Product/999999999999",
                "nombre":            "Producto Falso",
                "selectedVariantId": "gid://shopify/ProductVariant/999999999999",
                "colorSeleccionado": "Negro",
                "precioNumerico":    100000,
            },
            "talla":    "M",
            "cantidad": 1,
        }],
        "cartTotal":      100000,
        "idempotencyKey": f"verify-invalid-{uuid.uuid4()}",
    }, timeout=20)
    return r


def verify_mp_amount(init_point_url, expected_amount):
    """Verifica que la preferencia MP tiene el monto correcto."""
    import re
    match = re.search(r"pref_id=([\w-]+)", init_point_url)
    if not match:
        return ["No se pudo extraer pref_id de la URL"]

    pref_id = match.group(1)
    r = requests.get(
        f"https://api.mercadopago.com/checkout/preferences/{pref_id}",
        headers={"Authorization": f"Bearer {MP_ACCESS_TOKEN}"},
        timeout=10,
    )
    if not r.ok:
        return [f"MP API {r.status_code}: {r.text[:100]}"]

    pref = r.json()
    items = pref.get("items", [])
    if not items:
        return ["Preferencia MP sin items"]

    total_mp = sum(float(i.get("unit_price", 0)) * int(i.get("quantity", 1)) for i in items)
    if abs(total_mp - expected_amount) > 1:
        return [f"monto: esperado ${expected_amount:,.0f}, en MP ${total_mp:,.0f}"]

    return []


def test_login_campos_vacios():
    """Login sin campos debe retornar 400, no 500."""
    r = requests.post(f"{BASE}/api/login", json={}, timeout=10)
    return r

def test_login_creds_invalidas():
    """Login con creds incorrectas debe retornar 401, no 500."""
    r = requests.post(f"{BASE}/api/login", json={
        "email":    "noexiste@pavoa-verify.local",
        "password": "contrasenawrong123",
    }, timeout=10)
    return r

def test_mis_pedidos_sin_token():
    """mis-pedidos sin Authorization debe retornar 401, no 500."""
    r = requests.post(f"{BASE}/api/mis-pedidos", json={}, timeout=10)
    return r

def test_mis_pedidos_token_invalido():
    """mis-pedidos con token basura debe retornar 401, no 500."""
    r = requests.post(f"{BASE}/api/mis-pedidos", json={}, headers={
        "Authorization": "Bearer token_falso_verify_script",
    }, timeout=10)
    return r


def test_register_campos_vacios():
    """Registro sin datos debe validar antes de tocar Supabase."""
    return requests.post(
        f"{BASE}/api/register",
        json={},
        headers={"X-Forwarded-For": f"203.0.113.{uuid.uuid4().int % 200 + 1}"},
        timeout=10,
    )


def test_register_password_corta():
    """Registro con password corto debe retornar 400 y no crear usuario."""
    return requests.post(
        f"{BASE}/api/register",
        json={
            "firstName": "Test",
            "lastName": "Automatico",
            "email": f"verify-register-{uuid.uuid4().hex}@pavoa.invalid",
            "password": "corta",
        },
        headers={"X-Forwarded-For": f"203.0.113.{uuid.uuid4().int % 200 + 1}"},
        timeout=10,
    )


def test_forgot_password_sin_email():
    """Recuperacion sin email debe retornar 400."""
    return requests.post(
        f"{BASE}/api/forgot-password",
        json={},
        headers={"X-Forwarded-For": f"198.51.100.{uuid.uuid4().int % 200 + 1}"},
        timeout=10,
    )


def test_forgot_password_email_inexistente():
    """No debe revelar si una cuenta existe y debe responder 200."""
    return requests.post(
        f"{BASE}/api/forgot-password",
        json={"email": f"verify-forgot-{uuid.uuid4().hex}@pavoa.invalid"},
        headers={"X-Forwarded-For": f"198.51.100.{uuid.uuid4().int % 200 + 1}"},
        timeout=10,
    )


def verify_dispatch_email_template():
    """Ejecuta el template real y confirma que la guia llega al HTML."""
    tracking_number = "VERIFY-GUIA-987654"
    tracking_company = "Servientrega"
    tracking_url = "https://www.servientrega.com/wps/portal/rastreo-envio"
    script = f"""
import {{ emailDespacho }} from './api/_helpers/email-templates.js';
const html = emailDespacho({{
  nombreCliente: 'Test Automatico',
  orderName: '#VERIFY-001',
  subtitulo: 'Tu pedido esta en camino',
  cuerpo: 'Verificacion automatica del correo de despacho.',
  trackingCompany: {json.dumps(tracking_company)},
  trackingNumber: {json.dumps(tracking_number)},
  trackingUrl: {json.dumps(tracking_url)},
}});
process.stdout.write(JSON.stringify({{
  trackingNumber: html.includes({json.dumps(tracking_number)}),
  trackingCompany: html.includes({json.dumps(tracking_company)}),
  trackingUrl: html.includes({json.dumps(tracking_url)}),
  trackingButton: html.includes('Rastrear pedido'),
}}));
"""
    completed = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        capture_output=True,
        text=True,
        encoding="utf-8",
        timeout=10,
        check=False,
    )
    if completed.returncode != 0:
        return [f"Node fallo: {completed.stderr.strip()[:200]}"]

    checks = json.loads(completed.stdout)
    labels = {
        "trackingNumber": "numero de guia",
        "trackingCompany": "transportadora",
        "trackingUrl": "URL de rastreo",
        "trackingButton": "boton de rastreo",
    }
    return [f"Falta {labels[key]} en el HTML" for key, present in checks.items() if not present]


def test_email():
    """Envía un correo de prueba via Resend y verifica que salió."""
    # 1. Verificar que el API key es válido
    r = requests.get(
        "https://api.resend.com/domains",
        headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
        timeout=10,
    )
    if not r.ok:
        return None, f"API key inválida — HTTP {r.status_code}: {r.text[:100]}"

    # 2. Enviar correo de prueba
    r = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
        json={
            "from":    "PAVOA Verify <noreply@pavoa.com.co>",
            "to":      [VERIFY_EMAIL],
            "subject": "[verify] PAVOA — test de correo automático",
            "html":    "<p>Este correo confirma que el sistema de envío de PAVOA está funcionando correctamente.</p><p><small>Enviado por _verify_api.py</small></p>",
        },
        timeout=10,
    )
    if not r.ok:
        return None, f"Envío fallido — HTTP {r.status_code}: {r.text[:200]}"

    data = r.json()
    message_id = data.get("id")
    if not message_id:
        return None, f"Sin message_id en respuesta: {json.dumps(data)[:100]}"

    return message_id, None


def check_email_status(message_id):
    """Consulta el estado del correo enviado."""
    r = requests.get(
        f"https://api.resend.com/emails/{message_id}",
        headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
        timeout=10,
    )
    if not r.ok:
        return None, f"HTTP {r.status_code}"
    return r.json(), None


def test_webhook_shopify(topic, payload):
    """Simula un webhook de Shopify firmado correctamente."""
    body = json.dumps(payload, separators=(",", ":"))
    sig  = hmac.new(
        SHOPIFY_WEBHOOK_SECRET.encode(),
        body.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    sig_b64 = __import__("base64").b64encode(sig).decode()

    r = requests.post(
        f"{BASE}/api/webhook-shopify",
        data=body,
        headers={
            "Content-Type":              "application/json",
            "X-Shopify-Hmac-Sha256":     sig_b64,
            "X-Shopify-Topic":           topic,
            "X-Shopify-Shop-Domain":     SHOPIFY_DOMAIN,
            "X-Shopify-Webhook-Id":      str(uuid.uuid4()),
        },
        timeout=15,
    )
    return r


def delete_draft_order(draft_order_id):
    r = requests.delete(
        f"https://{SHOPIFY_DOMAIN}/admin/api/2026-04/draft_orders/{draft_order_id}.json",
        headers={"X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN},
        timeout=10,
    )
    return r.status_code

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    draft_order_id = None
    variant = None

    print("\n=== 1. STOREFRONT — variante de prueba ===")
    try:
        variant = get_test_variant()
        ok("shopify_storefront",
           f"{variant['name']} / {variant['variant_title']} / ${variant['price']:,.0f}")
        print(f"     variant_id: {variant['variant_id']} | disponible: {variant['available']}")
    except Exception as e:
        fail("shopify_storefront", str(e))

    if variant:
        print("\n=== 2. DRAFT ORDER (/api/pedido) ===")
        try:
            r = test_pedido(variant)
            data = r.json()
            if r.status_code == 200 and data.get("ok"):
                draft_order_id = data["draftOrderId"]
                ok("pedido", f"{data.get('name')} — ID {draft_order_id}")
            else:
                fail("pedido", f"HTTP {r.status_code} — {json.dumps(data)[:200]}")
        except Exception as e:
            fail("pedido", str(e))

        if draft_order_id:
            print("\n=== 2b. DATOS DEL DRAFT ORDER (Shopify admin) ===")
            try:
                issues, order = verify_draft_order_data(draft_order_id, variant)
                if not issues:
                    ok("draft_order_datos", f"email, nombre, dirección, variant y precio correctos")
                else:
                    for issue in issues:
                        fail("draft_order_datos", issue)
            except Exception as e:
                fail("draft_order_datos", str(e))

            print("\n=== 3. PREFERENCIA MP (/api/procesar-pago) ===")
            mp_link = None
            try:
                r = test_procesar_pago(draft_order_id, variant)
                data = r.json()
                if r.status_code == 200 and data.get("ok"):
                    mp_link = data.get("initPoint") or data.get("init_point") or ""
                    ok("procesar_pago", "Preferencia MP generada")
                    print(f"     init_point: {str(mp_link)[:80]}...")
                else:
                    fail("procesar_pago", f"HTTP {r.status_code} — {json.dumps(data)[:250]}")
            except Exception as e:
                fail("procesar_pago", str(e))

            if mp_link:
                print("\n=== 3b. MONTO EN PREFERENCIA MP ===")
                try:
                    issues = verify_mp_amount(mp_link, variant["price"])
                    if not issues:
                        ok("mp_monto", f"Monto correcto: ${variant['price']:,.0f}")
                    else:
                        for issue in issues:
                            fail("mp_monto", issue)
                except Exception as e:
                    fail("mp_monto", str(e))

        print("\n=== 2c. RECHAZO DE VARIANTE INVÁLIDA ===")
        try:
            r = test_pedido_variante_invalida()
            if r.status_code in (400, 422, 500):
                ok("variante_invalida", f"HTTP {r.status_code} — rechazado correctamente")
            elif r.status_code == 200:
                fail("variante_invalida", "Creó un pedido con variante falsa — fuga de validación")
            else:
                warn("variante_invalida", f"HTTP {r.status_code} inesperado")
        except Exception as e:
            fail("variante_invalida", str(e))

    print("\n=== 9. LOGIN (/api/login) ===")
    try:
        r = test_login_campos_vacios()
        if r.status_code == 400:
            ok("login_campos_vacios", f"HTTP 400 — valida campos correctamente")
        elif r.status_code == 500:
            fail("login_campos_vacios", "HTTP 500 — explota con payload vacío")
        else:
            warn("login_campos_vacios", f"HTTP {r.status_code} inesperado")
    except Exception as e:
        fail("login_campos_vacios", str(e))

    try:
        r = test_login_creds_invalidas()
        if r.status_code in (401, 400):
            ok("login_creds_invalidas", f"HTTP {r.status_code} — rechaza credenciales incorrectas")
        elif r.status_code == 500:
            fail("login_creds_invalidas", "HTTP 500 — explota con creds incorrectas")
        else:
            warn("login_creds_invalidas", f"HTTP {r.status_code} — {r.text[:80]}")
    except Exception as e:
        fail("login_creds_invalidas", str(e))

    print("\n=== 10. MIS PEDIDOS (/api/mis-pedidos) ===")
    try:
        r = test_mis_pedidos_sin_token()
        if r.status_code == 401:
            ok("mis_pedidos_sin_token", "HTTP 401 — requiere autenticación")
        elif r.status_code == 500:
            fail("mis_pedidos_sin_token", "HTTP 500 — explota sin token")
        else:
            warn("mis_pedidos_sin_token", f"HTTP {r.status_code} — {r.text[:80]}")
    except Exception as e:
        fail("mis_pedidos_sin_token", str(e))

    try:
        r = test_mis_pedidos_token_invalido()
        if r.status_code == 401:
            ok("mis_pedidos_token_invalido", "HTTP 401 — rechaza token falso")
        elif r.status_code == 500:
            fail("mis_pedidos_token_invalido", "HTTP 500 — explota con token inválido")
        else:
            warn("mis_pedidos_token_invalido", f"HTTP {r.status_code} — {r.text[:80]}")
    except Exception as e:
        fail("mis_pedidos_token_invalido", str(e))

    print("\n=== 11. REGISTRO (/api/register) ===")
    try:
        r = test_register_campos_vacios()
        if r.status_code == 400:
            ok("register_campos_vacios", "HTTP 400 — valida campos requeridos")
        elif r.status_code == 429:
            warn("register_campos_vacios", "HTTP 429 — rate limit activo; validacion no ejecutada")
        else:
            fail("register_campos_vacios", f"HTTP {r.status_code} — {r.text[:100]}")
    except Exception as e:
        fail("register_campos_vacios", str(e))

    try:
        r = test_register_password_corta()
        if r.status_code == 400:
            ok("register_password_corta", "HTTP 400 — exige minimo 8 caracteres")
        elif r.status_code == 429:
            warn("register_password_corta", "HTTP 429 — rate limit activo; validacion no ejecutada")
        else:
            fail("register_password_corta", f"HTTP {r.status_code} — {r.text[:100]}")
    except Exception as e:
        fail("register_password_corta", str(e))

    print("\n=== 12. RECUPERACION (/api/forgot-password) ===")
    try:
        r = test_forgot_password_sin_email()
        if r.status_code == 400:
            ok("forgot_password_sin_email", "HTTP 400 — exige correo")
        elif r.status_code == 429:
            warn("forgot_password_sin_email", "HTTP 429 — rate limit activo; validacion no ejecutada")
        else:
            fail("forgot_password_sin_email", f"HTTP {r.status_code} — {r.text[:100]}")
    except Exception as e:
        fail("forgot_password_sin_email", str(e))

    try:
        r = test_forgot_password_email_inexistente()
        if r.status_code == 200 and r.json().get("ok"):
            ok("forgot_password_email_inexistente", "HTTP 200 — no revela si la cuenta existe")
        elif r.status_code == 429:
            warn("forgot_password_email_inexistente", "HTTP 429 — rate limit activo; endpoint protegido")
        else:
            fail("forgot_password_email_inexistente", f"HTTP {r.status_code} — {r.text[:100]}")
    except Exception as e:
        fail("forgot_password_email_inexistente", str(e))

    print("\n=== 13. TEMPLATE CORREO DE DESPACHO ===")
    try:
        issues = verify_dispatch_email_template()
        if issues:
            for issue in issues:
                fail("email_despacho_tracking", issue)
        else:
            ok("email_despacho_tracking", "guia, transportadora y enlace presentes en el HTML")
    except Exception as e:
        fail("email_despacho_tracking", str(e))

    print("\n=== 7. CORREO (Resend) ===")
    try:
        message_id, err = test_email()
        if err:
            fail("email_envio", err)
        else:
            ok("email_envio", f"Salió — message_id: {message_id}")
            # Esperar 2s y verificar estado
            time.sleep(2)
            status_data, status_err = check_email_status(message_id)
            if status_err:
                warn("email_estado", status_err)
            else:
                estado = status_data.get("last_event") or status_data.get("status") or "desconocido"
                to_addr = status_data.get("to", [VERIFY_EMAIL])
                ok("email_estado", f"{estado} → {to_addr}")
    except Exception as e:
        fail("email_envio", str(e))

    print("\n=== 8. WEBHOOK SHOPIFY (firma simulada) ===")
    # Payload mínimo de orders/fulfilled con ID falso
    shopify_payload = {
        "id": 9999999999999,
        "order_number": 9999,
        "email": "test@pavoa.com.co",
        "financial_status": "paid",
        "fulfillment_status": "fulfilled",
        "fulfillments": [{
            "id": 1111111111,
            "status": "success",
            "tracking_number": "TEST-TRACKING-001",
            "tracking_company": "Servientrega",
            "tracking_url": "https://servientrega.com.co/tracking",
        }],
        "line_items": [{
            "id": 2222222222,
            "title": "MILAN COMFORT SET",
            "quantity": 1,
            "price": "10000.00",
            "variant_id": 47462066618508,
        }],
        "shipping_address": {
            "first_name": "Test",
            "last_name":  "Automatico",
            "address1":   "Calle 123 # 45-67",
            "city":       "Bogota",
            "country":    "Colombia",
        },
        "note_attributes": [
            {"name": "customer_email", "value": "test@pavoa.com.co"},
        ],
    }

    for topic in ["orders/fulfilled", "orders/updated"]:
        try:
            r = test_webhook_shopify(topic, shopify_payload)
            if r.status_code == 200:
                ok(f"webhook_shopify_{topic.replace('/', '_')}",
                   f"HTTP 200 — firma aceptada")
            else:
                fail(f"webhook_shopify_{topic.replace('/', '_')}",
                     f"HTTP {r.status_code} — {r.text[:100]}")
        except Exception as e:
            fail(f"webhook_shopify_{topic.replace('/', '_')}", str(e))

    cancelled_payload = {
        "id": 9999999999998,
        "name": "#VERIFY-CANCELLED",
        "order_number": 9998,
        "cancel_reason": "customer",
        "financial_status": "voided",
        "cancelled_at": "2026-06-08T12:00:00-05:00",
        "line_items": [],
    }
    try:
        r = test_webhook_shopify("orders/cancelled", cancelled_payload)
        if r.status_code == 200:
            ok("webhook_shopify_orders_cancelled", "HTTP 200 — evento aceptado sin pedido real")
        else:
            fail("webhook_shopify_orders_cancelled", f"HTTP {r.status_code} — {r.text[:100]}")
    except Exception as e:
        fail("webhook_shopify_orders_cancelled", str(e))

    refund_payload = {
        "id": 9999999999997,
        "order_id": 9999999999996,
        "created_at": "2026-06-08T12:00:00-05:00",
        "transactions": [{
            "kind": "refund",
            "status": "success",
            "amount": "10000.00",
        }],
        "refund_line_items": [],
    }
    try:
        r = test_webhook_shopify("refunds/create", refund_payload)
        if r.status_code == 200:
            ok("webhook_shopify_refunds_create", "HTTP 200 — evento aceptado sin restock")
        else:
            fail("webhook_shopify_refunds_create", f"HTTP {r.status_code} — {r.text[:100]}")
    except Exception as e:
        fail("webhook_shopify_refunds_create", str(e))

    print("\n=== 4. WEBHOOK MP (firma simulada) ===")
    try:
        r = test_webhook()
        if r.status_code == 200:
            ok("webhook_mp", f"HTTP {r.status_code} — endpoint activo y firma aceptada")
        else:
            fail("webhook_mp", f"HTTP {r.status_code} — {r.text[:100]}")
    except Exception as e:
        fail("webhook_mp", str(e))

    print("\n=== 5. NEWSLETTER (/api/contacto) ===")
    try:
        r = test_contacto()
        if r.status_code in (200, 201):
            ok("contacto_newsletter", f"HTTP {r.status_code}")
        else:
            warn("contacto_newsletter", f"HTTP {r.status_code} — {r.text[:100]}")
    except Exception as e:
        fail("contacto_newsletter", str(e))

    print("\n=== 6. CHECK DESCUENTO (/api/check-descuento) ===")
    try:
        r = test_descuento()
        if r.status_code in (200, 404):
            ok("check_descuento", f"HTTP {r.status_code} — endpoint responde")
        else:
            warn("check_descuento", f"HTTP {r.status_code} — {r.text[:100]}")
    except Exception as e:
        fail("check_descuento", str(e))

    if draft_order_id:
        print(f"\n=== LIMPIEZA — eliminando draft order {draft_order_id} ===")
        try:
            status = delete_draft_order(draft_order_id)
            if status in (200, 204):
                ok("cleanup", f"Draft order {draft_order_id} eliminado de Shopify")
            else:
                warn("cleanup", f"HTTP {status} al eliminar draft order — revisalo manualmente")
        except Exception as e:
            warn("cleanup", str(e))

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
    sys.exit(1 if failed else 0)
