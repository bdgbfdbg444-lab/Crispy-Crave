import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBnxmjVjKisKpejJl6opSZIKJcKIwCJXts",
  authDomain: "crispy-c9702.firebaseapp.com",
  databaseURL: "https://crispy-c9702-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "crispy-c9702",
  storageBucket: "crispy-c9702.firebasestorage.app",
  messagingSenderId: "332328214728",
  appId: "1:332328214728:web:3d5b958a839c6ba92345fd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
