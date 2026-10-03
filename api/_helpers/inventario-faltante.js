/**
 * Cuenta cuanto inventario sobra en Shopify por no haberse descontado nunca.
 *
 * Entre el 30 de junio y el 2 de octubre de 2026 las ordenes se crearon con
 * POST /orders.json sin inventory_behaviour, asi que Shopify aplico "bypass" y
 * no reclamo nada. Cada unidad vendida en esa ventana sigue contada como
 * disponible.
 *
 * La cuenta es mas simple de lo que parece. Una devolucion sube el numero de
 * Shopify (lo hace nuestro webhook de refunds) y tambien sube el real, porque la
 * prenda vuelve al estante: las dos se mueven igual y se cancelan. Lo que sobra
 * es, exactamente, lo vendido.
 *
 *   Shopify - real = (devueltas) - (-vendidas + devueltas) = vendidas
 *
 * Una orden cancelada no mueve ninguno de los dos, asi que se cuenta aparte.
 */

const LIMITE_POR_PAGINA = 250;

// Lo justo para la cuenta: pedir la orden completa multiplica el peso de la
// respuesta y la funcion de Vercel se corta a los diez segundos.
const CAMPOS = 'id,name,created_at,cancelled_at,line_items,refunds';

const siguientePagina = (linkHeader) => {
  const enlaces = String(linkHeader || '').split(',');
  for (const enlace of enlaces) {
    if (!/rel="next"/.test(enlace)) continue;
    const url = enlace.match(/<([^>]+)>/)?.[1];
    if (url) return url;
  }
  return null;
};

/**
 * Trae las ordenes creadas desde una fecha, siguiendo la paginacion de Shopify.
 * Se topa el numero de paginas a proposito: es mejor decir que la cuenta quedo
 * incompleta que agotar el tiempo de la funcion y no devolver nada.
 */
export const traerOrdenesDesde = async ({
  dominio,
  token,
  desde,
  maxPaginas = 4,
  fetchImpl = fetch,
}) => {
  let url = `https://${dominio}/admin/api/2026-04/orders.json?${new URLSearchParams({
    status: 'any',
    created_at_min: desde,
    limit: String(LIMITE_POR_PAGINA),
    fields: CAMPOS,
  })}`;

  const ordenes = [];
  let paginas = 0;

  while (url && paginas < maxPaginas) {
    const res = await fetchImpl(url, { headers: { 'X-Shopify-Access-Token': token } });
    paginas += 1;

    if (!res.ok) {
      const detalle = await res.text().catch(() => '');
      return {
        ok: false,
        error: `Shopify ${res.status}: ${detalle.slice(0, 200)}`,
        paginas,
      };
    }

    const data = await res.json();
    ordenes.push(...(data?.orders || []));
    url = siguientePagina(res.headers?.get?.('link') || res.headers?.get?.('Link'));
  }

  return { ok: true, ordenes, paginas, truncado: Boolean(url) };
};

/**
 * Agrupa por variante, que es donde Shopify cuenta el inventario. Una linea sin
 * variante —un cargo suelto escrito a mano— no tiene unidades que descontar.
 */
export const acumularDescuadre = (ordenes = []) => {
  const porVariante = new Map();
  let canceladas = 0;
  let revisadas = 0;

  const entrada = (li) => {
    const variantId = String(li?.variant_id || '').trim();
    if (!variantId) return null;

    if (!porVariante.has(variantId)) {
      porVariante.set(variantId, {
        variantId,
        producto: li.title || null,
        variante: li.variant_title || null,
        sku: li.sku || null,
        sobran: 0,
        devueltas: 0,
        enCanceladas: 0,
      });
    }
    return porVariante.get(variantId);
  };

  for (const orden of ordenes) {
    revisadas += 1;
    const cancelada = Boolean(orden?.cancelled_at);
    if (cancelada) canceladas += 1;

    for (const li of orden?.line_items || []) {
      const fila = entrada(li);
      if (!fila) continue;
      const cantidad = Number(li.quantity || 0);
      if (cancelada) fila.enCanceladas += cantidad;
      else fila.sobran += cantidad;
    }

    // Las devoluciones no cambian la cuenta —suben los dos numeros por igual—
    // pero se muestran para que nadie tenga que confiar en esa explicacion a
    // ciegas: con la columna delante se puede comprobar.
    for (const refund of orden?.refunds || []) {
      for (const rli of refund?.refund_line_items || []) {
        const fila = entrada(rli?.line_item || {});
        if (!fila) continue;
        fila.devueltas += Number(rli.quantity || 0);
      }
    }
  }

  const filas = [...porVariante.values()]
    .filter((f) => f.sobran > 0 || f.enCanceladas > 0)
    .sort((a, b) => b.sobran - a.sobran || String(a.producto).localeCompare(String(b.producto)));

  return {
    revisadas,
    canceladas,
    totalQueSobra: filas.reduce((suma, f) => suma + f.sobran, 0),
    porVariante: filas,
  };
};
