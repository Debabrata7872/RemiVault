import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBgc2Dap9csYQ0foT_1L0fGQgDO4GiCBZc",
  authDomain: "remivault-2026.firebaseapp.com",
  projectId: "remivault-2026",
  storageBucket: "remivault-2026.firebasestorage.app",
  messagingSenderId: "660958535135",
  appId: "1:660958535135:web:06b0728699185fb8e1386a",
  measurementId: "G-8HKYBLW3YE"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Request email and profile scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');
