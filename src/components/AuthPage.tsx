import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const trimmedName = name.trim();
        if (trimmedName.length < 1 || trimmedName.length > 80) {
          throw new Error('Nome inválido');
        }
        await updateProfile(userCredential.user, { displayName: trimmedName });
        await auth.currentUser?.reload();
        // Force page reload to ensure auth context gets the updated user with displayName
        window.location.href = '/connect';
        return;
      }
      navigate('/connect');
    } catch (err: any) {
      let errorMessage = 'Ocorreu um erro. Tente novamente.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está em uso. Tente fazer login.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'E-mail inválido.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        errorMessage = 'E-mail ou senha incorretos.';
      }
      // Log only unexpected errors to prevent spamming the preview with expected user errors
      if (!err.code?.startsWith('auth/')) {
        console.error(err);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-4xl md:text-5xl font-bold font-sans text-center text-pink-400 mb-8 mt-2">
          POLENCA Notes
        </h1>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-2xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1 ml-1">Nome</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border-[1.5px] border-pink-100 border-b-[4px] border-b-pink-200 rounded-2xl px-4 py-3 outline-none focus:border-b-[1.5px] focus:translate-y-[2.5px] focus:border-pink-300 focus:shadow-inner transition-all text-gray-700 font-secondary"
                placeholder="Seu nome ou apelido"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1 ml-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border-[1.5px] border-pink-100 border-b-[4px] border-b-pink-200 rounded-2xl px-4 py-3 outline-none focus:border-b-[1.5px] focus:translate-y-[2.5px] focus:border-pink-300 focus:shadow-inner transition-all text-gray-700 font-secondary"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1 ml-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border-[1.5px] border-pink-100 border-b-[4px] border-b-pink-200 rounded-2xl px-4 py-3 outline-none focus:border-b-[1.5px] focus:translate-y-[2.5px] focus:border-pink-300 focus:shadow-inner transition-all text-gray-700"
              style={{ fontFamily: 'system-ui, sans-serif' }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 border-b-4 border-pink-600 active:border-b-0 active:translate-y-[4px] text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-pink-300/50 disabled:opacity-70 mt-2 disabled:active:translate-y-0 disabled:active:border-b-4"
          >
            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-pink-500 bg-white hover:bg-white border-b-[3px] border-pink-200 active:border-b-0 active:translate-y-[3px] font-semibold transition-all px-4 py-2 rounded-xl shadow-sm"
          >
            {isLogin ? 'Ainda não tem conta? Crie uma!' : 'Já tem uma conta? Entre!'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
