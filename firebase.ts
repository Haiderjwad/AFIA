import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAbVcpuHlF-0znuWXU3IzGQzccpwtYthBs",
  authDomain: "so-system-dedd6.firebaseapp.com",
  projectId: "so-system-dedd6",
  storageBucket: "so-system-dedd6.firebasestorage.app",
  messagingSenderId: "132679072651",
  appId: "1:132679072651:web:2bce20903cc8d4c57c8d8e"
};

const app = initializeApp(firebaseConfig);

// Modern way to enable persistence (resolves deprecation warning)
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

export const auth = getAuth(app);


