/**
 * Red de respaldo para los avisos de pago de Mercado Pago.
 *
 * Un aviso se puede perder: una caida de red, un despliegue a destiempo, un
 * reintento que Mercado Pago no vuelve a hacer. Cuando eso pasa el dinero entra
 * y la orden no existe en ninguna parte. Paso el 1 de octubre de 2026 con una
 * transferencia: la clienta pago y el pedido no estaba ni en Shopify ni en el
 * panel, y nadie tenia forma de notarlo.
 *
 * La primera version de esta red partia de nuestros propios registros: los
 * pagos que alguna vez reportaron "pendiente". Eso deja fuera justo el peor
 * caso, porque si no llega ningun aviso nunca conocemos el numero del pago y el
 * cobro queda invisible. Aqui se le pregunta a Mercado Pago cuales pagos
 * aprobo, asi que la red ya no depende de haber recibido nada.
 */

const MP_SEARCH_URL = 'https://api.mercadopago.com/v1/payments/search';

// El checkout arma external_reference como "<draftOrderId>|<email>|<0|1>". Un
// pago hecho por fuera de la tienda —un link de cobro a mano— no la tiene, y
// reprocesarlo no significaria nada: no hay draft que convertir en orden.
const REFERENCIA_PAVOA = /^\d+\|[^|]+\|[01]$/;

export const esReferenciaPavoa = (referencia) =>
  REFERENCIA_PAVOA.test(String(referencia || '').trim());

/**
 * Distingue un cobro hecho por fuera de la tienda de una referencia de la
 * tienda que llego a medias. Los dos se descartan —sin las tres partes no hay
 * nada que completar— pero no significan lo mismo: el primero es rutina y el
 * segundo es una anomalia que alguien tiene que mirar a mano.
 *
 * Nunca se devuelve la referencia completa: lleva el correo del cliente.
 */
export const describirReferencia = (referencia) => {
  const texto = String(referencia || '').trim();
  if (!texto) return { clase: 'ausente', motivo: 'cobro sin referencia, hecho por fuera de la tienda' };
  if (REFERENCIA_PAVOA.test(texto)) return { clase: 'completa', motivo: null };

  const partes = texto.split('|').length;
  return {
    clase: 'incompleta',
    motivo: `referencia incompleta (${partes} ${partes === 1 ? 'parte' : 'partes'})`,
  };
};

// Mercado Pago documenta las fechas con desplazamiento explicito, no con "Z".
const fechaParaMp = (fecha) => fecha.toISOString().replace('Z', '-00:00');

/**
 * Pregunta por los pagos aprobados de la ventana.
 *
 * Se intenta primero por fecha de ultima actualizacion: una transferencia
 * creada hace nueve dias y aprobada hoy no aparece si se busca por fecha de
 * creacion, y es exactamente la que hay que rescatar. Si la cuenta no admite
 * ese rango se repite por creacion, y el resultado dice cual se uso.
 */
export const buscarPagosAprobados = async ({
  accessToken,
  dias = 7,
  limite = 50,
  ahora = new Date(),
  fetchImpl = fetch,
} = {}) => {
  const desde = new Date(ahora.getTime() - dias * 24 * 60 * 60 * 1000);
  const rangos = ['date_last_updated', 'date_created'];

  for (const rango of rangos) {
    const url = `${MP_SEARCH_URL}?${new URLSearchParams({
      status: 'approved',
      range: rango,
      begin_date: fechaParaMp(desde),
      end_date: fechaParaMp(ahora),
      sort: 'date_created',
      criteria: 'desc',
      limit: String(limite),
    })}`;

    let res;
    try {
      res = await fetchImpl(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    } catch (err) {
      return { ok: false, rango, error: `No se pudo consultar Mercado Pago: ${err.message}` };
    }

    const cuerpo = await res.text();
    let data = null;
    try {
      data = JSON.parse(cuerpo);
    } catch {}

    if (res.ok) {
      return {
        ok: true,
        rango,
        pagos: Array.isArray(data?.results) ? data.results : [],
        total: Number(data?.paging?.total ?? 0),
      };
    }

    // Un rango que la cuenta no admite llega como 4xx, asi que vale la pena
    // probar el otro antes de darse por vencido. Un 5xx no se reintenta: el
    // problema esta del lado de Mercado Pago y la tanda siguiente lo vera.
    const valeReintentar = res.status >= 400 && res.status < 500 && rango !== rangos[rangos.length - 1];
    if (!valeReintentar) {
      return {
        ok: false,
        rango,
        status: res.status,
        error: data?.message || cuerpo.slice(0, 200) || `Mercado Pago respondio ${res.status}`,
      };
    }
  }

  return { ok: false, error: 'Mercado Pago rechazo las dos busquedas.' };
};

/**
 * Separa los pagos aprobados que todavia no tienen pedido.
 *
 * Devuelve tambien por que se descarto cada uno: un "revisados: 0" que no
 * distingue entre "no habia nada que rescatar" y "se filtro todo por error" no
 * sirve para diagnosticar nada, y es el tipo de silencio que dejo pasar el
 * pedido perdido la primera vez.
 */
export const seleccionarHuerfanos = ({ pagos = [], idsConPedido = [], tope = 3 } = {}) => {
  const conPedido = new Set([...idsConPedido].map((id) => String(id)));
  const vistos = new Set();
  const candidatos = [];
  const descartados = [];
  const anomalias = [];

  for (const pago of pagos) {
    const id = String(pago?.id || '').trim();
    if (!id || vistos.has(id)) continue;
    vistos.add(id);

    if (pago?.status !== 'approved') {
      descartados.push({ paymentId: id, motivo: `status ${pago?.status || 'desconocido'}` });
      continue;
    }
    // El pedido se mira antes que la referencia: un pago ya registrado esta
    // bien sin importar como se vea su referencia, y avisar de el cada diez
    // minutos seria ruido que acabaria tapando un aviso de verdad.
    if (conPedido.has(id)) {
      descartados.push({ paymentId: id, motivo: 'ya tiene pedido' });
      continue;
    }

    const referencia = describirReferencia(pago?.external_reference);
    if (referencia.clase !== 'completa') {
      descartados.push({ paymentId: id, motivo: referencia.motivo });
      // Una referencia a medias no se puede rescatar sola —falta el correo de
      // la cuenta y el borrador ya no existe— pero sin pedido es dinero cobrado
      // que no llego a ninguna parte, y eso no puede quedar callado.
      if (referencia.clase === 'incompleta') anomalias.push({ paymentId: id, motivo: referencia.motivo });
      continue;
    }

    candidatos.push(id);
  }

  return {
    huerfanos: candidatos.slice(0, tope),
    // Lo que no entra en esta tanda lo toma la siguiente: la funcion de Vercel
    // se corta a los diez segundos y cada rescate habla varias veces con
    // Shopify. Se reportan para que no parezca que ya no quedaba nada.
    postergados: candidatos.slice(tope),
    descartados,
    anomalias,
  };
};

/**
 * Busca, compara y rescata. Las tres dependencias se inyectan para poder fijar
 * el comportamiento con pruebas sin tocar Mercado Pago ni Supabase.
 */
export const conciliarPagosAprobados = async ({
  buscar,
  pedidosExistentes,
  procesar,
  tope = 3,
} = {}) => {
  const busqueda = await buscar();
  if (!busqueda?.ok) {
    return {
      ok: false,
      error: busqueda?.error || 'No se pudo consultar Mercado Pago.',
      rango: busqueda?.rango || null,
    };
  }

  // Se pregunta por todos los aprobados, no solo por los de referencia
  // completa: tambien hay que poder decir que un pago de referencia rara ya
  // tiene su pedido, o se avisaria de el para siempre.
  const idsAprobados = (busqueda.pagos || [])
    .filter((p) => p?.status === 'approved' && p?.id)
    .map((p) => String(p.id));

  let idsConPedido = [];
  if (idsAprobados.length > 0) {
    try {
      idsConPedido = await pedidosExistentes(idsAprobados);
    } catch (err) {
      // Sin saber cuales ya tienen pedido, todos pareceria huerfanos. Volver a
      // procesarlos no haria dano —cada pago verifica su propio pedido antes de
      // tocar nada— pero gastaria la tanda entera en falsos positivos y taparia
      // el fallo real. Mejor decirlo.
      return { ok: false, error: `No se pudieron leer los pedidos: ${err.message}`, rango: busqueda.rango };
    }
  }

  const { huerfanos, postergados, descartados, anomalias } = seleccionarHuerfanos({
    pagos: busqueda.pagos || [],
    idsConPedido,
    tope,
  });

  const rescatados = [];
  const sinCambio = [];

  for (const paymentId of huerfanos) {
    try {
      const r = await procesar(paymentId);
      if (r?.shopifyCompleted) rescatados.push({ paymentId, orden: r.shopifyOrderName || null });
      else sinCambio.push({ paymentId, status: r?.status || r?.code || 'desconocido' });
    } catch (err) {
      sinCambio.push({ paymentId, error: err.message });
    }
  }

  return {
    ok: true,
    rango: busqueda.rango,
    aprobadosEnVentana: (busqueda.pagos || []).length,
    totalSegunMp: busqueda.total ?? null,
    revisados: huerfanos.length,
    rescatados,
    sinCambio,
    postergados,
    descartados,
    anomalias,
  };
};
