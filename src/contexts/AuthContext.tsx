import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Casal } from '../types';

interface AuthContextType {
  user: User | null;
  casal: Casal | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  casal: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [casal, setCasal] = useState<Casal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.uid !== user?.uid) {
        setLoading(true);
      }
      setUser(currentUser);
      if (!currentUser) {
        setCasal(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'casais'),
      where('membros', 'array-contains', user.uid)
    );

    const unsubscribeCasal = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setCasal({ id: doc.id, ...doc.data() } as Casal);
      } else {
        setCasal(null);
      }
      setLoading(false);
    });

    return () => unsubscribeCasal();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, casal, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
