/**
 * Diagnostico de la lista de clientes de Shopify contra los registrados.
 *
 * La pestana de Clientes de Shopify esta llena de repetidos —el mismo nombre
 * diez veces, sin pedidos— y entre ellos se pierden los que si se registraron.
 * Antes de cortar la fuente o limpiar nada hay que saber de donde salen, y eso
 * no se deduce mirando la pantalla: se cuenta. Esto solo lee.
 */

const PAGINA = 50;

// El historial de cada cliente es la pista mas directa de su origen: Shopify
// anota quien lo creo y desde donde. Se piden los dos primeros eventos, que son
// los de su nacimiento.
const consultaClientes = (conEventos) => `#graphql
  query Clientes($cursor: String) {
    customers(first: ${PAGINA}, after: $cursor, sortKey: CREATED_AT) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        displayName
        createdAt
        state
        tags
        numberOfOrders
        amountSpent { amount }
        defaultEmailAddress { emailAddress marketingState }
        defaultPhoneNumber { phoneNumber }
        defaultAddress { city province }
        ${conEventos ? 'events(first: 2) { nodes { message createdAt } }' : ''}
      }
    }
  }
`;

const normalizarCorreo = (valor) => String(valor || '').trim().toLowerCase() || null;

const normalizarNombre = (valor) =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const sinHtml = (texto) => String(texto || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

const idCorto = (gid) => String(gid || '').split('/').pop();

/**
 * Trae todos los clientes, pagina por pagina. Un error de GraphQL llega con
 * status 200 y se devuelve tal cual: un permiso faltante o un campo que esta
 * version no conoce tienen que verse, no quedar como una lista vacia.
 */
export const traerClientesShopify = async ({
  dominio,
  token,
  conEventos = true,
  maxPaginas = 6,
  fetchImpl = fetch,
}) => {
  const clientes = [];
  let cursor = null;
  let paginas = 0;
  let hayMas = true;

  while (hayMas && paginas < maxPaginas) {
    const res = await fetchImpl(`https://${dominio}/admin/api/2026-04/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ query: consultaClientes(conEventos), variables: { cursor } }),
    });
    paginas += 1;

    if (!res.ok) {
      const detalle = await res.text().catch(() => '');
      return { ok: false, error: `Shopify ${res.status}: ${detalle.slice(0, 300)}`, paginas };
    }

    const data = await res.json();
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return { ok: false, error: data.errors.map((e) => e.message).join(' | '), paginas };
    }

    const conexion = data?.data?.customers;
    clientes.push(...(conexion?.nodes || []));
    hayMas = Boolean(conexion?.pageInfo?.hasNextPage);
    cursor = conexion?.pageInfo?.endCursor || null;
  }

  return { ok: true, clientes, paginas, truncado: hayMas };
};

/**
 * Clasifica cada cliente y agrupa los repetidos. Pura: recibe los datos ya
 * traidos para poder fijarla con pruebas.
 *
 * El orden de las clases importa. Un registrado sin compras sigue siendo un
 * registrado —es justo el que ella quiere ver—, y un comprador sin cuenta no es
 * basura aunque no tenga registro.
 */
export const diagnosticarClientes = ({ clientes = [], registrados = [] } = {}) => {
  const porCorreoRegistrado = new Map(
    registrados
      .filter((u) => normalizarCorreo(u?.email))
      .map((u) => [normalizarCorreo(u.email), u]),
  );

  const filas = clientes.map((c) => {
    const correo = normalizarCorreo(c?.defaultEmailAddress?.emailAddress);
    const pedidos = Number(c?.numberOfOrders || 0);
    const registro = correo ? porCorreoRegistrado.get(correo) : null;

    let clase;
    if (registro) clase = 'registrado';
    else if (pedidos > 0) clase = 'comprador';
    else if (!correo) clase = 'huerfano-sin-correo';
    else clase = 'huerfano-con-correo';

    return {
      id: idCorto(c?.id),
      nombre: c?.displayName || null,
      correo,
      telefono: c?.defaultPhoneNumber?.phoneNumber || null,
      pedidos,
      gastado: Number(c?.amountSpent?.amount || 0),
      creado: c?.createdAt || null,
      ciudad: c?.defaultAddress?.city || null,
      marketing: c?.defaultEmailAddress?.marketingState || null,
      verificado: registro ? Boolean(registro.email_verified) : null,
      origen: (c?.events?.nodes || []).map((e) => sinHtml(e.message)).filter(Boolean),
      clase,
    };
  });

  const grupos = new Map();
  for (const fila of filas) {
    const clave = normalizarNombre(fila.nombre);
    if (!clave) continue;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(fila);
  }

  const repetidos = [...grupos.values()]
    .filter((g) => g.length > 1)
    .map((g) => ({
      nombre: g[0].nombre,
      veces: g.length,
      conCorreo: g.filter((f) => f.correo).length,
      sinCorreo: g.filter((f) => !f.correo).length,
      conPedidos: g.filter((f) => f.pedidos > 0).length,
      correosDistintos: new Set(g.map((f) => f.correo).filter(Boolean)).size,
      telefonosDistintos: new Set(g.map((f) => f.telefono).filter(Boolean)).size,
    }))
    .sort((a, b) => b.veces - a.veces);

  const correosEnShopify = new Set(filas.map((f) => f.correo).filter(Boolean));
  const registradosFaltantes = [...porCorreoRegistrado.keys()].filter((c) => !correosEnShopify.has(c));

  const contar = (clase) => filas.filter((f) => f.clase === clase).length;

  return {
    resumen: {
      totalShopify: filas.length,
      totalRegistrados: porCorreoRegistrado.size,
      registrados: contar('registrado'),
      compradores: contar('comprador'),
      huerfanosSinCorreo: contar('huerfano-sin-correo'),
      huerfanosConCorreo: contar('huerfano-con-correo'),
      registradosQueFaltanEnShopify: registradosFaltantes.length,
    },
    registradosFaltantes,
    repetidos,
    clientes: filas,
  };
};
