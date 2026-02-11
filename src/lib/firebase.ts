// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// IMPORTANT: This object will be populated by the system. Do not change it.
const firebaseConfig = {
  apiKey: "AIzaSyAfr_poE5fJFChvf3VfdCOxWsYyBUl8HDs",
  authDomain: "dev-pff-studio-09.firebaseapp.com",
  projectId: "dev-pff-studio-09",
  storageBucket: "dev-pff-studio-09.appspot.com",
  messagingSenderId: "1009893976321",
  appId: "1:1009893976321:web:3555239a0398a67676b92a"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
