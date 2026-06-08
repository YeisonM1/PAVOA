import sys, os, hmac, hashlib, time, uuid, json
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
            print("\n=== 3. PREFERENCIA MP (/api/procesar-pago) ===")
            try:
                r = test_procesar_pago(draft_order_id, variant)
                data = r.json()
                if r.status_code == 200 and data.get("ok"):
                    link = data.get("initPoint") or data.get("init_point") or "—"
                    ok("procesar_pago", "Preferencia MP generada")
                    print(f"     init_point: {str(link)[:80]}...")
                else:
                    fail("procesar_pago", f"HTTP {r.status_code} — {json.dumps(data)[:250]}")
            except Exception as e:
                fail("procesar_pago", str(e))

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
