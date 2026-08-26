import React, { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { generateInviteCode } from '../lib/utils';
import { Copy, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function ConnectPage() {
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateCouple = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    
    try {
      const code = generateInviteCode();
      const casalRef = doc(db, 'casais', code);

      await setDoc(casalRef, {
        membros: [user.uid],
        nomes: { [user.uid]: user.displayName || 'Eu' },
        codigoConvite: code,
        criadoEm: Date.now()
      });
      setCreatedCode(code);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao criar casal.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteCode) return;
    setLoading(true);
    setError('');

    try {
      const code = inviteCode.trim().toUpperCase();
      if (!/^[A-Z0-9]{8}$/.test(code)) {
        setError('Digite um código válido.');
        setLoading(false);
        return;
      }

      const casalRef = doc(db, 'casais', code);
      const casalSnapshot = await getDoc(casalRef);

      if (!casalSnapshot.exists()) {
        setError('Código inválido ou não encontrado.');
        setLoading(false);
        return;
      }

      const data = casalSnapshot.data();

      if (data.membros.length >= 2 && !data.membros.includes(user.uid)) {
        setError('Este casal já possui dois membros.');
        setLoading(false);
        return;
      }

      await setDoc(casalRef, {
        ...data,
        membros: [data.membros[0], user.uid],
        nomes: { ...data.nomes, [user.uid]: user.displayName || 'Parceiro(a)' }
      });
      
      // The onSnapshot in AuthContext will pick this up and redirect
    } catch (err: any) {
      console.error(err);
      setError('Erro ao conectar.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdCode);
    alert('Código copiado!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[0%] left-[-10%] w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-72 h-72 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border border-white shadow-2xl rounded-3xl p-8 w-full max-w-md z-10"
      >
        
        <h1 className="text-2xl font-bold font-sans text-center text-gray-800 mb-2">
          Conecte-se
        </h1>
        <p className="text-center text-gray-500 font-medium mb-8 text-sm font-secondary">
          Crie um novo espaço para vocês dois ou entre com um código de convite.
        </p>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-2xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {!createdCode ? (
          <div className="space-y-6">
            <button
              onClick={handleCreateCouple}
              disabled={loading}
              className="w-full bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 border-b-4 border-pink-600 active:border-b-0 active:translate-y-[4px] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-pink-300/50 disabled:opacity-70 disabled:active:translate-y-0 disabled:active:border-b-4 flex items-center justify-center gap-2"
            >
              Criar Espaço
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">OU</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <form onSubmit={handleJoinCouple} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1 ml-1">Já tenho um código</label>
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full bg-white border-[1.5px] border-purple-100 border-b-[4px] border-b-purple-200 rounded-2xl px-4 py-3 outline-none focus:border-b-[1.5px] focus:translate-y-[2.5px] focus:border-purple-300 focus:shadow-inner transition-all text-gray-700 text-center font-bold tracking-widest uppercase font-sans"
                  placeholder="X7Y9Z1AB"
                  maxLength={8}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !inviteCode}
                className="w-full bg-gradient-to-b from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 border-b-4 border-purple-600 active:border-b-0 active:translate-y-[4px] text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-purple-300/50 disabled:opacity-70 disabled:active:translate-y-0 disabled:active:border-b-4 flex items-center justify-center gap-2"
              >
                Conectar <ArrowRight size={18} />
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <p className="text-gray-600 font-medium font-secondary">Seu código de convite é:</p>
            <div className="bg-white border-2 border-dashed border-pink-200 rounded-2xl py-6 flex items-center justify-center gap-3">
              <span className="text-4xl font-black font-sans text-pink-500 tracking-widest">{createdCode}</span>
              <button onClick={copyToClipboard} className="text-gray-400 hover:text-pink-500 bg-white hover:bg-white p-3 rounded-xl border-b-[3px] border-gray-200 hover:border-pink-200 active:border-b-0 active:translate-y-[3px] transition-all shadow-sm">
                <Copy size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-500 font-secondary">
              Compartilhe este código com seu parceiro(a). Esta tela atualizará automaticamente quando ele(a) conectar.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
