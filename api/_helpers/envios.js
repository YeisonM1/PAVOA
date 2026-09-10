// Tarifas de envio por zona.
//
// La regla vive SOLO aqui. `api/pedido.js` y el checkout la importan, para
// que el precio que ve el cliente y el que cobra el servidor no se separen
// nunca. Antes estaba escrita dos veces y no coincidian: el front miraba
// solo la ciudad y el servidor exigia ciudad + departamento.
//
// La condicion base es por DEPARTAMENTO, pero una zona tambien puede listar
// MUNICIPIOS sueltos, y el municipio le gana al departamento. Eso es lo que
// permite que Bogota y su sabana (Chia, Cajica, Sopo...) paguen una tarifa y
// el resto de Cundinamarca (Girardot, Ubate) pague otra, siendo el mismo
// departamento.
//
// Los dos campos vienen de selects cerrados en el checkout: 33 departamentos
// y los 1.104 municipios del pais. No son texto libre a proposito, porque de
// ellos depende el precio.
//
// La configuracion la edita la tienda desde pavoa-control y viaja en el
// metafield de shop `pavoa_envios / zonas_envio`.
//
// Vive en api/_helpers y no en src/utils a proposito: Vite empaqueta sin
// problema un .js relativo del backend, pero un import.meta.env o el alias
// `@/` colandose desde src/ romperia la funcion serverless en el deploy.
// Por eso este archivo es JS puro, sin dependencias ni process.env.

export const SHIPPING_NAMESPACE = 'pavoa_envios';
export const SHIPPING_ZONES_KEY = 'zonas_envio';
export const SHIPPING_LEGACY_KEY = 'precio_envio';

// Ultimo recurso si no hay nada configurado ni se puede consultar Shopify.
export const DEFAULT_NATIONAL_SHIPPING = 18900;

const normalizar = (valor) => String(valor || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '');

const aEntero = (valor) => {
  const n = Number.parseInt(String(valor ?? '').replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};

/**
 * Normaliza lo que venga del metafield a una forma con la que se pueda
 * trabajar sin comprobar nulos en cada linea.
 *
 * Acepta tres formas, en este orden:
 *   1. La tabla nueva:
 *      { base, zonas: [{ nombre, departamentos, ciudades, precio }] }
 *   2. Un numero suelto: la tarifa unica que existia antes
 *   3. Nada: cae a DEFAULT_NATIONAL_SHIPPING
 */
export const parseShippingConfig = (raw) => {
  const vacio = { base: DEFAULT_NATIONAL_SHIPPING, zonas: [] };
  if (raw === null || raw === undefined || raw === '') return vacio;

  let datos = raw;
  if (typeof raw === 'string') {
    const comoNumero = aEntero(raw);
    try {
      datos = JSON.parse(raw);
    } catch {
      return comoNumero > 0 ? { base: comoNumero, zonas: [] } : vacio;
    }
  }

  if (typeof datos === 'number') {
    return datos > 0 ? { base: Math.round(datos), zonas: [] } : vacio;
  }
  if (!datos || typeof datos !== 'object') return vacio;

  const base = aEntero(datos.base);
  const zonas = Array.isArray(datos.zonas) ? datos.zonas : [];

  return {
    base: base > 0 ? base : DEFAULT_NATIONAL_SHIPPING,
    zonas: zonas
      .map((zona) => ({
        nombre: String(zona?.nombre || '').trim(),
        precio: aEntero(zona?.precio),
        departamentos: Array.isArray(zona?.departamentos)
          ? zona.departamentos.map((d) => String(d || '').trim()).filter(Boolean)
          : [],
        ciudades: Array.isArray(zona?.ciudades)
          ? zona.ciudades.map((c) => String(c || '').trim()).filter(Boolean)
          : [],
      }))
      .filter((zona) => zona.precio !== null
        && zona.precio >= 0
        && (zona.departamentos.length > 0 || zona.ciudades.length > 0)),
  };
};

/**
 * La zona a la que pertenece un destino, o null si paga la tarifa base.
 *
 * El municipio manda sobre el departamento: Chia esta en Cundinamarca, pero
 * si alguna zona lo nombra como municipio, esa zona gana. Si no lo nombra
 * ninguna, decide su departamento.
 */
export const zonaDeDestino = ({ departamento, ciudad } = {}, config) => {
  const { zonas } = parseShippingConfig(config);
  const dep = normalizar(departamento);
  const mun = normalizar(ciudad);

  if (mun) {
    const porCiudad = zonas.find((z) => z.ciudades.some((c) => normalizar(c) === mun));
    if (porCiudad) return porCiudad;
  }
  if (!dep) return null;
  return zonas.find((z) => z.departamentos.some((d) => normalizar(d) === dep)) || null;
};

/**
 * Precio de envio para un destino.
 *
 * Devuelve la tarifa base cuando el destino no cae en ninguna zona, que es
 * el caso de la mayoria del pais.
 */
export const resolverEnvio = (destino, config) => {
  const { base } = parseShippingConfig(config);
  // Retrocompatible: durante un tiempo esto recibio solo el departamento.
  const entrada = (destino && typeof destino === 'object')
    ? destino
    : { departamento: destino };
  const zona = zonaDeDestino(entrada, config);
  return zona ? zona.precio : base;
};

/**
 * Revisa una configuracion antes de guardarla.
 * Un departamento en dos zonas haria que el precio dependiera del orden.
 */
export const validarShippingConfig = (config) => {
  const errores = [];
  const { base, zonas } = parseShippingConfig(config);

  if (!(base > 0)) errores.push('La tarifa base debe ser mayor que cero.');

  const deps = new Map();
  const muns = new Map();
  zonas.forEach((zona) => {
    if (!zona.nombre) errores.push('Hay una zona sin nombre.');

    zona.departamentos.forEach((dep) => {
      const clave = normalizar(dep);
      if (deps.has(clave)) {
        errores.push(`${dep} esta en "${deps.get(clave)}" y en "${zona.nombre}".`);
      } else {
        deps.set(clave, zona.nombre);
      }
    });

    // Un municipio en dos zonas si es ambiguo. Un municipio cuyo departamento
    // esta en otra zona NO lo es: para eso existe la regla de que el
    // municipio manda.
    zona.ciudades.forEach((ciudad) => {
      const clave = normalizar(ciudad);
      if (muns.has(clave)) {
        errores.push(`${ciudad} esta en "${muns.get(clave)}" y en "${zona.nombre}".`);
      } else {
        muns.set(clave, zona.nombre);
      }
    });
  });

  return { ok: errores.length === 0, errores };
};
