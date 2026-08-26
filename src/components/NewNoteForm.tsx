import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Send, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

export function NewNoteForm() {
  const { user, casal } = useAuth();
  const [texto, setTexto] = useState('');
  const [humor, setHumor] = useState('');
  const [privada, setPrivada] = useState(false);
  const [loading, setLoading] = useState(false);

  const Emojis = ['😊', '🥺', '😔', '🥰', '😡', '😂'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !casal || !texto.trim()) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'notas'), {
        casalId: casal.id,
        autorId: user.uid,
        autorNome: user.displayName || 'Eu',
        texto: texto.trim(),
        humor: humor || null,
        reacoes: {},
        criadoEm: Date.now(),
        privada
      });

      setTexto('');
      setHumor('');
      setPrivada(false);
    } catch (err) {
      console.error('Erro ao enviar nota', err);
      alert('Erro ao enviar a nota. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="relative z-30 bg-white rounded-3xl p-4 shadow-[0_15px_40px_-15px_rgba(236,72,153,0.3),inset_0_1px_2px_rgba(255,255,255,0.9)] border-[1.5px] border-white flex flex-col gap-3 transform-gpu"
    >
      {loading && (
        <div className="absolute inset-0 bg-white rounded-3xl flex items-center justify-center z-10 ">
          <span className="text-pink-400 font-bold text-sm animate-pulse">Enviando...</span>
        </div>
      )}
      
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escreva algo para o seu amor..."
        className="w-full bg-white border-[1.5px] border-pink-100 border-b-[4px] border-b-pink-200 rounded-2xl p-3 outline-none resize-none text-gray-700 placeholder:text-gray-400 min-h-[60px] focus:border-b-[1.5px] focus:translate-y-[2.5px] focus:border-pink-300 focus:shadow-inner transition-all font-secondary"
      />

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-2 overflow-x-auto py-2 -my-2 px-1 -mx-1 scrollbar-hide flex-1 mr-2">
          {Emojis.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => setHumor(humor === e ? '' : e)}
              className={cn(
                "text-xl p-1 rounded-2xl transition-all flex items-center justify-center shrink-0 border-[1.5px] border-b-[3px] border-b-transparent active:border-b-[1.5px] active:translate-y-[1.5px]",
                humor === e ? "bg-white border-pink-200 shadow-sm scale-110" : "opacity-50 hover:opacity-100 border-transparent hover:border-pink-200 hover:bg-white"
              )}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setPrivada(!privada)}
            className={cn(
              "p-2 rounded-full transition-all shadow-sm border-[1.5px] border-b-[3px] border-b-gray-200 active:border-b-[1.5px] active:translate-y-[1.5px]",
              privada ? "text-purple-500 bg-white border-purple-200" : "text-gray-400 bg-white border-white hover:border-gray-300 hover:bg-white"
            )}
            title="Somente você"
          >
            <Lock size={18} className={privada ? "fill-current opacity-20" : ""} />
          </button>

          <button
            type="submit"
            disabled={!texto.trim() || loading}
            className="bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 border-b-4 border-pink-600 text-white p-3 rounded-2xl transition-all shadow-lg shadow-pink-300/50 active:border-b-0 active:translate-y-[4px] disabled:opacity-70 disabled:active:border-b-4 disabled:active:translate-y-0 flex items-center justify-center shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </form>
  );
}
