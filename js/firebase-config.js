import { initializeApp }
from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { getAuth, GoogleAuthProvider }
from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import { getStorage }
from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAT33BHY-eBUH6z3mPGIMWRVwvjlB83KYM",
  authDomain: "totalcare-services.firebaseapp.com",
  projectId: "totalcare-services",
  storageBucket: "totalcare-services.firebasestorage.app",
  messagingSenderId: "572964730853",
  appId: "1:572964730853:web:8c7e1776b559a1e958e10c"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});