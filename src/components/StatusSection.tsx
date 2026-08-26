import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Status } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';

export function StatusSection() {
  const { user, casal } = useAuth();
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editTexto, setEditTexto] = useState('');
  const [editEmoji, setEditEmoji] = useState('😊');

  useEffect(() => {
    if (!casal) return;

    // We can just subscribe to the statuses of the two members
    const unsubscribes = casal.membros.map(uid => 
      onSnapshot(doc(db, 'status', uid), (snapshot) => {
        if (snapshot.exists()) {
          setStatuses(prev => ({ ...prev, [uid]: { id: uid, ...snapshot.data() } as Status }));
        }
      })
    );

    return () => unsubscribes.forEach(unsub => unsub());
  }, [casal]);

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !casal) return;

    try {
      await setDoc(doc(db, 'status', user.uid), {
        casalId: casal.id,
        texto: editTexto,
        emoji: editEmoji,
        atualizadoEm: Date.now()
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Erro ao salvar status', err);
    }
  };

  if (!user || !casal) return null;

  const isStatusValid = (status?: Status) => {
    if (!status?.atualizadoEm) return false;
    return Date.now() - status.atualizadoEm <= 24 * 60 * 60 * 1000;
  };

  let myStatus = statuses[user.uid];
  if (myStatus && !isStatusValid(myStatus)) {
    myStatus = undefined;
  }

  const partnerUid = casal.membros.find(uid => uid !== user.uid);
  let partnerStatus = partnerUid ? statuses[partnerUid] : undefined;
  if (partnerStatus && !isStatusValid(partnerStatus)) {
    partnerStatus = undefined;
  }

  const Emojis = ['😊', '😍', '😔', '🥺', '😴', '😤', '🤧', '🥳'];

  return (
    <>
      <div className="mb-6 relative z-10">
        <div className="px-2 mb-3">
          <h2 className="text-gray-500/80 text-[11px] font-bold uppercase tracking-wider">Humor de Hoje</h2>
        </div>

        <div className="flex flex-col gap-3">
          {/* Meu Status (Row) */}
          <div 
            onClick={() => {
              setEditTexto(myStatus?.texto || '');
              setEditEmoji(myStatus?.emoji || '😊');
              setIsEditing(true);
            }}
            className="flex items-center gap-4 bg-white p-3 rounded-[24px] border-[1.5px] border-white shadow-[0_4px_15px_-3px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.9)] cursor-pointer hover:bg-white transition-all active:scale-[0.98] group"
          >
            <div className="w-14 h-14 bg-white rounded-[18px] flex items-center justify-center text-3xl border border-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
              {myStatus?.emoji || '❔'}
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex justify-between items-center mb-0.5">
                <p className="font-bold text-gray-800 text-sm truncate">{user.displayName || 'Eu'}</p>
                {myStatus?.atualizadoEm && (
                  <span className="text-[10px] text-pink-400/80 font-semibold shrink-0">
                    {formatDistanceToNow(myStatus.atualizadoEm, { locale: ptBR })}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-xs break-words line-clamp-2 leading-tight font-secondary">
                {myStatus?.texto || 'Toque para atualizar seu humor...'}
              </p>
            </div>
          </div>

          {/* Parceiro Status (Row) */}
          <div className="flex items-center gap-4 bg-white p-3 rounded-[24px] border-[1.5px] border-white shadow-[0_4px_15px_-3px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.9)] transition-all">
            {partnerUid ? (
              <>
                <div className="w-14 h-14 bg-white rounded-[18px] flex items-center justify-center text-3xl border border-white shadow-sm shrink-0">
                  {partnerStatus?.emoji || '❔'}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="font-bold text-gray-800 text-sm truncate">{casal.nomes?.[partnerUid] || 'Parceiro(a)'}</p>
                    {partnerStatus?.atualizadoEm && (
                      <span className="text-[10px] text-purple-400/80 font-semibold shrink-0">
                        {formatDistanceToNow(partnerStatus.atualizadoEm, { locale: ptBR })}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-xs break-words line-clamp-2 leading-tight font-secondary">
                    {partnerStatus?.texto || 'Sem status'}
                  </p>
                </div>
              </>
            ) : (
              <div className="w-full py-3 flex flex-col items-center justify-center text-center">
                <p className="text-xs text-gray-400 font-medium font-secondary">Aguardando parceiro(a)...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing && createPortal(
        <div className="fixed inset-0 bg-black/20 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border-[1.5px] border-white">
            <h3 className="font-bold font-sans text-xl text-gray-800 mb-4">Como você está?</h3>
            
            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div className="grid grid-cols-4 gap-2 mb-4 bg-white p-3 rounded-2xl border-[1.5px] border-white">
                {Emojis.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEditEmoji(e)}
                    className={cn(
                      "text-2xl p-2 rounded-2xl transition-all border-b-2 border-b-transparent active:border-b-0 active:translate-y-[2px]",
                      editEmoji === e 
                        ? "scale-110 bg-white border-[1.5px] border-white shadow-[0_4px_10px_-2px_rgba(236,72,153,0.3)]" 
                        : "opacity-50 hover:opacity-100 hover:bg-white border-[1.5px] border-transparent hover:border-white"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
              
              <input
                type="text"
                value={editTexto}
                onChange={(e) => setEditTexto(e.target.value)}
                maxLength={30}
                placeholder="Ex: morrendo de saudades"
                className="w-full bg-white border-[1.5px] border-pink-100 border-b-[4px] border-b-pink-200 rounded-2xl px-4 py-3 outline-none focus:border-b-[1.5px] focus:translate-y-[2.5px] focus:border-pink-300 focus:shadow-inner transition-all text-gray-700 text-sm font-secondary"
              />
              
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 font-semibold text-gray-600 bg-white hover:bg-gray-50 border-[1.5px] border-gray-100 border-b-4 border-b-gray-200 rounded-2xl transition-all shadow-sm active:border-b-[1.5px] active:translate-y-[2.5px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 font-semibold text-white bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 border-b-4 border-pink-600 rounded-2xl transition-all shadow-lg shadow-pink-300/50 active:border-b-0 active:translate-y-[4px]"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
