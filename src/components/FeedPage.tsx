import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { StatusSection } from './StatusSection';
import { NewNoteForm } from './NewNoteForm';
import { NoteFeed } from './NoteFeed';
import { LogOut, Home, MessageCircleHeart, UserPlus, X, Copy } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function FeedPage() {
  const { user, casal } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'notes'>('home');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const copyToClipboard = () => {
    if (casal?.codigoConvite) {
      navigator.clipboard.writeText(casal.codigoConvite);
      alert('Código copiado!');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !casal || !inviteCodeInput) return;
    setJoinLoading(true);
    setJoinError('');

    try {
      const code = inviteCodeInput.trim().toUpperCase();
      if (!/^[A-Z0-9]{8}$/.test(code)) {
        setJoinError('Digite um código válido.');
        setJoinLoading(false);
        return;
      }

      const targetCasalRef = doc(db, 'casais', code);
      const targetSnapshot = await getDoc(targetCasalRef);

      if (!targetSnapshot.exists()) {
        setJoinError('Código inválido ou não encontrado.');
        setJoinLoading(false);
        return;
      }

      const targetData = targetSnapshot.data();

      if (targetSnapshot.id === casal.id) {
        setJoinError('Este é o seu próprio código!');
        setJoinLoading(false);
        return;
      }

      if (targetData.membros.length >= 2) {
        setJoinError('Este casal já possui dois membros.');
        setJoinLoading(false);
        return;
      }

      const batch = writeBatch(db);
      batch.update(targetCasalRef, {
        membros: [targetData.membros[0], user.uid],
        nomes: { ...targetData.nomes, [user.uid]: user.displayName || 'Parceiro(a)' }
      });
      batch.delete(doc(db, 'casais', casal.id));
      await batch.commit();

      setShowInviteModal(false);
    } catch (err) {
      console.error(err);
      setJoinError('Erro ao conectar.');
    } finally {
      setJoinLoading(false);
    }
  };

  const partnerId = casal?.membros?.find(id => id !== user?.uid);
  const partnerName = (partnerId && casal?.nomes?.[partnerId]) || 'Seu Parceiro(a)';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 pb-24 relative overflow-clip">
      {/* Decorative Blobs */}
      <div className="absolute top-[0%] left-[-10%] w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[20%] w-72 h-72 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000 pointer-events-none"></div>

      <main className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4">
        {/* Soft fade mask for the header */}
        <div className="fixed top-0 left-0 right-0 h-28 bg-gradient-to-b from-pink-50 via-purple-50 to-transparent pointer-events-none z-30"></div>
        <header className="sticky top-0 z-40 pt-8 pb-4 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black font-sans text-pink-400 tracking-tight">
              POLENCA Notes
            </h1>
          </div>
          
          <div className="flex gap-2">
            {casal?.membros?.length === 2 && (
              <button 
                onClick={() => setShowInviteModal(true)}
                className="w-10 h-10 bg-white hover:bg-white text-gray-400 hover:text-purple-500 rounded-full flex items-center justify-center transition-all border-[1.5px] border-white border-b-[3px] border-b-gray-200 shadow-sm active:border-b-[1.5px] active:translate-y-[1.5px]"
                title="Conexão"
              >
                <UserPlus size={16} />
              </button>
            )}
            <button 
              onClick={() => auth.signOut()}
              className="w-10 h-10 bg-white hover:bg-white text-gray-400 hover:text-red-400 rounded-full flex items-center justify-center transition-all border-[1.5px] border-white border-b-[3px] border-b-gray-200 shadow-sm active:border-b-[1.5px] active:translate-y-[1.5px]"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {casal?.membros?.length === 1 && activeTab === 'home' && (
          <div 
            onClick={() => setShowInviteModal(true)}
            className="mb-8 max-w-2xl mx-auto relative overflow-hidden bg-gradient-to-br from-purple-50 to-white border-[1.5px] border-purple-200 rounded-[24px] p-5 shadow-[0_8px_30px_-10px_rgba(168,85,247,0.2)] cursor-pointer hover:shadow-[0_15px_40px_-15px_rgba(168,85,247,0.3)] transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex-1 pr-4">
                <h3 className="text-purple-900 font-bold text-sm mb-1">Aguardando Parceiro(a)</h3>
                <p className="text-purple-600/80 text-xs leading-relaxed font-secondary">Conecte-se para compartilhar notas e atualizar humores.</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-purple-200 transition-all shadow-sm">
                <UserPlus size={18} />
              </div>
            </div>
            {/* Soft background glow */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl group-hover:bg-purple-300/40 transition-colors pointer-events-none"></div>
          </div>
        )}

        <AnimatePresence mode="wait">

          {activeTab === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 max-w-2xl mx-auto"
            >
              <StatusSection />
              
              <div className="bg-white p-6 rounded-3xl shadow-[0_15px_40px_-15px_rgba(236,72,153,0.3),inset_0_1px_2px_rgba(255,255,255,0.9)] border-[1.5px] border-white text-center mt-8 relative z-10 transform-gpu">
                <div className="w-16 h-16 bg-white border-[1.5px] border-white rounded-full flex items-center justify-center mx-auto mb-4 text-pink-400 shadow-[0_8px_20px_-6px_rgba(236,72,153,0.3)]">
                  <MessageCircleHeart size={32} />
                </div>
                <h3 className="font-bold font-sans text-xl text-gray-800 mb-2">Caixinha de Notas</h3>
                <p className="text-sm text-gray-500 mb-4 font-secondary">
                  Deixe um recadinho, um desabafo ou apenas lembre o quanto você ama
                </p>
                <button 
                  onClick={() => setActiveTab('notes')}
                  className="w-full bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 border-b-4 border-pink-600 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-pink-300/50 active:border-b-0 active:translate-y-[4px]"
                >
                  Abrir Notas
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="notes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="pb-32 pt-[190px]"
            >
              <section>
                <NoteFeed />
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {activeTab === 'notes' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[84px] left-0 right-0 z-30 pointer-events-none px-4"
          >
            <div className="max-w-md md:max-w-2xl mx-auto pointer-events-auto mt-4">
              <NewNoteForm />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white border border-white shadow-2xl rounded-full p-1.5 flex gap-1 items-center">
          <button
            onClick={() => setActiveTab('home')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300",
              activeTab === 'home' 
                ? "bg-white text-pink-500 shadow-md scale-100" 
                : "text-gray-500 hover:bg-white hover:text-pink-400 scale-95 hover:scale-100"
            )}
          >
            <Home size={20} className={activeTab === 'home' ? "fill-pink-200" : ""} />
            <span className="text-sm font-bold">Início</span>
          </button>
          
          <button
            onClick={() => setActiveTab('notes')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300",
              activeTab === 'notes' 
                ? "bg-white text-pink-500 shadow-md scale-100" 
                : "text-gray-500 hover:bg-white hover:text-pink-400 scale-95 hover:scale-100"
            )}
          >
            <MessageCircleHeart size={20} className={activeTab === 'notes' ? "fill-pink-200" : ""} />
            <span className="text-sm font-bold">Notas</span>
          </button>
        </div>
      </div>
      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative text-center border border-white"
            >
              <button 
                onClick={() => setShowInviteModal(false)}
                className="absolute top-4 right-4 text-gray-400 p-2 bg-white hover:bg-gray-100 rounded-full border-[1.5px] border-white border-b-[3px] border-b-gray-200 transition-all active:border-b-[1.5px] active:translate-y-[1.5px]"
              >
                <X size={20} />
              </button>
              
              <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus size={32} />
              </div>
              
              <h3 className="font-bold font-sans text-gray-800 mb-2 text-2xl">
                {casal?.membros?.length === 1 ? 'Código de Convite' : 'Sua Conexão'}
              </h3>
              
              {casal?.membros?.length === 1 ? (
                <>
                  <p className="text-gray-500 mb-6 text-sm font-secondary">
                    Compartilhe seu código abaixo com seu parceiro(a):
                  </p>
                  <div className="bg-purple-50 border-2 border-dashed border-purple-200 rounded-2xl py-6 flex items-center justify-center gap-3 mb-6">
                    <span className="text-4xl font-black font-sans text-purple-600 tracking-widest">{casal?.codigoConvite}</span>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="w-full bg-gradient-to-b from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 border-b-4 border-purple-600 active:border-b-0 active:translate-y-[4px] text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-purple-300/50 flex items-center justify-center gap-2 mb-6"
                  >
                    <Copy size={20} />
                    Copiar Código
                  </button>

                  <div className="relative flex items-center py-2 mb-4">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">OU</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                  </div>

                  <form onSubmit={handleJoin} className="text-left space-y-4">
                    {joinError && (
                      <div className="bg-red-50 text-red-500 p-3 rounded-2xl text-sm text-center">
                        {joinError}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1 ml-1">Já tenho o código dele(a)</label>
                      <input
                        type="text"
                        required
                        value={inviteCodeInput}
                        onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                        className="w-full bg-white border-[1.5px] border-purple-100 border-b-[4px] border-b-purple-200 rounded-2xl px-4 py-3 outline-none focus:border-b-[1.5px] focus:translate-y-[2.5px] focus:border-purple-300 focus:shadow-inner transition-all text-gray-700 text-center font-bold tracking-widest uppercase font-sans"
                        placeholder="X7Y9Z1AB"
                        maxLength={8}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={joinLoading || !inviteCodeInput}
                      className="w-full bg-gradient-to-b from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300 border-b-4 border-purple-300 active:border-b-0 active:translate-y-[4px] text-purple-700 font-bold py-3.5 rounded-2xl transition-all disabled:opacity-70 disabled:active:border-b-4 disabled:active:translate-y-0 flex items-center justify-center shadow-md shadow-purple-100/50"
                    >
                      Conectar
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="bg-purple-50 p-6 rounded-3xl mb-6">
                    <p className="text-purple-500 font-medium text-sm mb-1 font-secondary">
                      Conectado com
                    </p>
                    <p className="text-purple-800 font-black text-2xl mb-4">
                      {partnerName}
                    </p>
                    <div className="bg-white rounded-2xl p-3 flex flex-col gap-1 items-center justify-center">
                      <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">Tempo Juntos</span>
                      <span className="text-purple-700 font-semibold">
                        {casal?.criadoEm ? formatDistanceToNow(casal.criadoEm, { locale: ptBR }) : 'algum tempo'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="w-full bg-gradient-to-b from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-b-4 border-gray-300 active:border-b-0 active:translate-y-[4px] text-gray-700 font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-gray-200/50"
                  >
                    Fechar
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
