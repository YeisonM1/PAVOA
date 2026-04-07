import { supabase } from '../config/supabase';

// Trae TODOS los productos (Para el Home y Categorías)
export const getProductos = async () => {
  try {
    const { data, error } = await supabase.from('productos').select('*');
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('❌ Error de conexión:', err);
    return [];
  }
};

// Trae UN SOLO producto por su ID (Para la página 1 a 1)
export const getProductoById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single(); // Le decimos que solo queremos un resultado

    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`❌ Error al obtener el producto con id ${id}:`, err);
    return null;
  }
};

// Trae la información del banner de una categoría específica
export const getCategoriaById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`❌ Error al obtener categoría ${id}:`, err);
    return null;
  }
};

// Guarda un mensaje de contacto en Supabase
export const enviarContacto = async ({ nombre, contacto, asunto, mensaje }) => {
  try {
    const { error } = await supabase
      .from('contactos')
      .insert([{ nombre, contacto, asunto, mensaje }]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('❌ Error al enviar contacto:', err);
    return false;
  }
};