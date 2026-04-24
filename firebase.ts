// import { initializeApp } from "firebase/app";
// import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
// import { getAuth } from "firebase/auth";

// const firebaseConfig = {
//     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//     appId: import.meta.env.VITE_FIREBASE_APP_ID
// };

// const app = initializeApp(firebaseConfig);

// // Modern way to enable persistence (resolves deprecation warning)
// export const db = initializeFirestore(app, {
//     localCache: persistentLocalCache({
//         tabManager: persistentMultipleTabManager()
//     })
// });

// export const auth = getAuth(app);


import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyAbVcpuHlF-0znuWXU3IzGQzccpwtYthBs",
  authDomain: "so-system-dedd6.firebaseapp.com",
  projectId: "so-system-dedd6",
  storageBucket: "so-system-dedd6.firebasestorage.app",
  messagingSenderId: "132679072651",
  appId: "1:132679072651:web:2bce20903cc8d4c57c8d8e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);