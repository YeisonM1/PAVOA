import { supabase } from '../config/supabase';

export const getProductos = async () => {
  try {
    console.log("Intentando conectar con Supabase...");
    
    const { data, error } = await supabase
      .from('productos')
      .select('*');

    if (error) {
      console.error('❌ Error de Supabase:', error.message);
      return [];
    }
    
    console.log("✅ Conexión exitosa. Productos recibidos:", data);
    return data || [];
    
  } catch (err) {
    console.error('❌ Error fatal de conexión:', err);
    return [];
  }
};