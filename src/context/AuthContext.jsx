import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

// Retries getDoc a few times with a short delay, to ride out the brief
// window between auth-account creation and the profile doc being written.
async function fetchUserDocWithRetry(uid, attempts = 5, delayMs = 600) {
    for (let i = 0; i < attempts; i++) {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            return userDoc.data();
        }
        if (i < attempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    return null; // genuinely missing after all retries
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                try {
                    const data = await fetchUserDocWithRetry(user.uid);
                    if (data) {
                        setUserData(data);
                    } else {
                        console.error("User document does not exist after retries. Signing out...");
                        setUserData(null);
                        await signOut(auth);
                    }
                } catch (error) {
                    // Real errors (e.g. permission-denied) shouldn't be retried —
                    // that means rules are misconfigured, not a timing issue.
                    console.error("Error fetching user data:", error.code, error.message);
                    setUserData(null);
                }
            } else {
                setUserData(null);
            }

            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = { currentUser, userData, loading };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
