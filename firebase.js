import { initializeApp } from "firebase/app";

import {
  getFirestore
} from "firebase/firestore";

import {
  getAuth
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA11JNQJmb4ONmIzMPmWcgtPMH1vY321NY",
  authDomain: "escolinha-app-ebef6.firebaseapp.com",
  projectId: "escolinha-app-ebef6",
  storageBucket: "escolinha-app-ebef6.firebasestorage.app",
  messagingSenderId: "749543558748",
  appId: "1:749543558748:web:a3a24bbd1c9659c68fe099"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };