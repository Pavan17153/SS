// admin/src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBF4BMm9nSbgsd4Y-a5vlnXdmdhWlZTZGs",
  authDomain: "ssfashion-14f5f.firebaseapp.com",
  projectId: "ssfashion-14f5f",
  storageBucket: "ssfashion-14f5f.appspot.com",
  messagingSenderId: "1036102703602",
  appId: "1:1036102703602:web:6d0d99bc915a2ffdf0736b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
