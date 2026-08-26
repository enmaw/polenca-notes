import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Nota } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Lock, Edit2, X, AlertCircle, SmilePlus } from 'lucide-react';
import { cn } from '../lib/utils';

const REACTION_EMOJIS = ['❤️', '🥰', '😍', '😂', '🥺', '😭', '😡', '🔥', '👀'];

export function NoteFeed() {
  const { user, casal } = useAuth();
  const [notas, setNotas] = useState<Nota[]>([]);
  const [editingNota, setEditingNota] = useState<Nota | null>(null);
  const [editTexto, setEditTexto] = useState('');
  const [deletingNotaId, setDeletingNotaId] = useState<string | null>(null);
  const [reactingTo, setReactingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!casal || !user) return;

    const notesRef = collection(db, 'notas');
    const publicQuery = query(
      notesRef,
      where('casalId', '==', casal.id),
      where('privada', '==', false)
    );
    const privateQuery = query(
      notesRef,
      where('casalId', '==', casal.id),
      where('privada', '==', true),
      where('autorId', '==', user.uid)
    );

    const notesById = new Map<string, Nota>();
    const sync = () => {
      setNotas(Array.from(notesById.values()).sort((a, b) => b.criadoEm - a.criadoEm));
    };

    const unsubscribePublic = onSnapshot(publicQuery, snapshot => {
      snapshot.docs.forEach(item => {
        notesById.set(item.id, { id: item.id, ...item.data() } as Nota);
      });
      sync();
    });

    const unsubscribePrivate = onSnapshot(privateQuery, snapshot => {
      snapshot.docs.forEach(item => {
        notesById.set(item.id, { id: item.id, ...item.data() } as Nota);
      });
      sync();
    });

    return () => {
      unsubscribePublic();
      unsubscribePrivate();
    };
  }, [casal, user]);

  const confirmDelete = async () => {
    if (!deletingNotaId) return;
    try {
      await deleteDoc(doc(db, 'notas', deletingNotaId));
      setDeletingNotaId(null);
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  const startEdit = (nota: Nota) => {
    setEditingNota(nota);
    setEditTexto(nota.texto);
  };

  const saveEdit = async () => {
    const texto = editTexto.trim();
    if (!editingNota || !texto) return;

    try {
      await updateDoc(doc(db, 'notas', editingNota.id), {
        texto,
        editadoEm: Date.now()
      });
      setEditingNota(null);
    } catch (err) {
      console.error('Erro ao editar:', err);
    }
  };

  const handleReact = async (notaId: string, emoji: string) => {
    if (!user) return;
    const nota = notas.find(item => item.id === notaId);
    if (!nota) return;

    const reactions = { ...(nota.reacoes || {}) };
    if (reactions[user.uid] === emoji) {
      delete reactions[user.uid];
    } else {
      reactions[user.uid] = emoji;
    }

    try {
      await updateDoc(doc(db, 'notas', notaId), { reacoes: reactions });
      setReactingTo(null);
    } catch (err) {
      console.error('Erro ao reagir:', err);
    }
  };

  if (!user) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
      <AnimatePresence>
        {notas.map(nota => {
          const isMine = nota.autorId === user.uid;
          const reactionsList = Object.entries(nota.reacoes || {});

          return (
            <motion.div
              key={nota.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ zIndex: reactingTo === nota.id ? 50 : 1 }}
              className={cn(
                'relative p-5 border-[1.5px] rounded-3xl transform-gpu transition-all',
                isMine
                  ? 'bg-gradient-to-br from-pink-50 to-white border-pink-200 shadow-[0_15px_40px_-15px_rgba(236,72,153,0.3),inset_0_1px_2px_rgba(255,255,255,0.9)]'
                  : 'bg-gradient-to-br from-purple-50 to-white border-purple-200 shadow-[0_15px_40px_-15px_rgba(168,85,247,0.3),inset_0_1px_2px_rgba(255,255,255,0.9)]'
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={cn(
                  'text-[11px] font-bold uppercase tracking-widest flex items-center gap-2',
                  isMine ? 'text-pink-600/70' : 'text-purple-600/70'
                )}>
                  {isMine ? 'Você' : nota.autorNome}
                  {nota.privada && <Lock size={12} className="opacity-50" />}
                </span>

                {nota.humor && (
                  <div className="text-3xl drop-shadow-sm -mt-2 -mr-2">
                    {nota.humor}
                  </div>
                )}
              </div>

              <p className={cn(
                'text-[15px] whitespace-pre-wrap font-medium leading-relaxed mb-4 font-secondary',
                isMine ? 'text-gray-700' : 'text-gray-600'
              )}>
                {nota.texto}
              </p>

              <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-black/5">
                <div className="flex items-center justify-between relative">
                  <span className="text-[10px] opacity-50 font-semibold">
                    {formatDistanceToNow(nota.criadoEm, { locale: ptBR })} atrás
                    {nota.editadoEm && ' • Editado'}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setReactingTo(reactingTo === nota.id ? null : nota.id)}
                      className={cn(
                        'p-2 rounded-full transition-all flex items-center justify-center border-[1.5px] border-b-[3px] border-b-gray-200 active:border-b-[1.5px] active:translate-y-[1.5px] shadow-sm',
                        nota.reacoes?.[user.uid]
                          ? 'bg-pink-100 text-pink-500 border-pink-200'
                          : 'bg-white hover:bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {nota.reacoes?.[user.uid] ? (
                        <span className="text-sm leading-none">{nota.reacoes[user.uid]}</span>
                      ) : (
                        <SmilePlus size={16} />
                      )}
                    </button>

                    {isMine && (
                      <>
                        <button
                          onClick={() => startEdit(nota)}
                          className="p-2 rounded-full bg-white hover:bg-blue-50 text-gray-500 hover:text-blue-500 border-[1.5px] border-white border-b-[3px] border-b-gray-200 hover:border-blue-200 active:border-b-[1.5px] active:translate-y-[1.5px] transition-all shadow-sm"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingNotaId(nota.id)}
                          className="p-2 rounded-full bg-white hover:bg-red-50 text-gray-500 hover:text-red-500 border-[1.5px] border-white border-b-[3px] border-b-gray-200 hover:border-red-200 active:border-b-[1.5px] active:translate-y-[1.5px] transition-all shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>

                  <AnimatePresence>
                    {reactingTo === nota.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute right-0 bottom-full mb-3 bg-white rounded-3xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] p-2 grid grid-cols-5 gap-1 border-[1.5px] border-white z-[100] w-[240px]"
                      >
                        {REACTION_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(nota.id, emoji)}
                            className={cn(
                              'text-xl p-2 rounded-2xl transition-all hover:scale-110 border-b-2 border-b-transparent active:border-b-0 active:translate-y-[2px]',
                              nota.reacoes?.[user.uid] === emoji
                                ? 'bg-white border-[1.5px] border-pink-200 shadow-sm'
                                : 'border-[1.5px] border-transparent hover:border-pink-200/50 hover:bg-white'
                            )}
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {reactionsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {reactionsList.map(([uid, emoji]) => {
                      const isMe = uid === user.uid;
                      const reactorName = casal?.nomes?.[uid] || (isMe ? 'Você' : 'Parceiro(a)');
                      return (
                        <div key={uid} className="bg-white text-pink-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 border border-white shadow-sm">
                          <span>{emoji}</span>
                          <span className="opacity-70">{reactorName}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {deletingNotaId && createPortal(
        <div className="fixed inset-0 bg-black/20 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative text-center border-[1.5px] border-white">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="font-bold font-sans text-gray-800 mb-2 text-2xl">Apagar Recado?</h3>
            <p className="text-gray-500 mb-6 text-sm font-secondary">
              Tem certeza que deseja apagar este recado? Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingNotaId(null)}
                className="flex-1 bg-gradient-to-b from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-b-4 border-gray-300 text-gray-700 font-bold py-3 rounded-2xl transition-all shadow-md shadow-gray-200/50 active:border-b-0 active:translate-y-[4px]"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-gradient-to-b from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 border-b-4 border-red-600 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-red-300/50 active:border-b-0 active:translate-y-[4px]"
              >
                Sim, apagar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {editingNota && createPortal(
        <div className="fixed inset-0 bg-black/20 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative border-[1.5px] border-white">
            <button
              onClick={() => setEditingNota(null)}
              className="absolute top-4 right-4 text-gray-400 p-2 bg-white hover:bg-gray-100 rounded-full border-[1.5px] border-gray-100 border-b-[3px] border-b-gray-200 active:border-b-[1.5px] active:translate-y-[1.5px] transition-all shadow-sm"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold font-sans text-gray-800 mb-4 text-2xl">Editar Recado</h3>
            <textarea
              value={editTexto}
              onChange={e => setEditTexto(e.target.value)}
              maxLength={5000}
              className="w-full bg-white border-[1.5px] border-pink-100 border-b-[4px] border-b-pink-200 rounded-2xl p-4 text-base outline-none resize-none min-h-[120px] mb-4 focus:border-b-[1.5px] focus:translate-y-[2.5px] focus:border-pink-300 focus:shadow-inner transition-all text-gray-700 font-secondary"
            />
            <button
              onClick={saveEdit}
              disabled={!editTexto.trim()}
              className="w-full bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 border-b-4 border-pink-600 disabled:opacity-50 disabled:active:border-b-4 disabled:active:translate-y-0 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-pink-300/50 active:border-b-0 active:translate-y-[4px]"
            >
              Salvar Alterações
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
