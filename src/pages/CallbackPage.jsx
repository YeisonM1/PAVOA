import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { manejarCallback } from '../services/authService';

export default function CallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    manejarCallback()
      .then(() => navigate('/cuenta', { replace: true }))
      .catch(() => navigate('/', { replace: true }));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-stone-500 animate-pulse">
        Iniciando sesión...
      </span>
    </div>
  );
}