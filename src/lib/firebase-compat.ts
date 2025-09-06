// Temporary Firebase compatibility layer
// This file provides compatible functions for the existing codebase during migration

export const db = null; // Will be replaced by API calls
export const storage = null; // Will be replaced by file upload service

// Firebase Firestore compatibility functions
export const collection = () => null;
export const query = () => null;
export const where = () => null;
export const getDocs = async () => ({ 
  docs: [],
  empty: true,
  size: 0
});
export const orderBy = () => null;
export const addDoc = async () => ({ id: 'temp' });
export const doc = () => null;
export const getDoc = async () => ({ 
  exists: () => false, 
  data: () => ({}),
  id: 'temp'
});
export const setDoc = async () => {};
export const updateDoc = async () => {};
export const deleteDoc = async () => {};
export const serverTimestamp = () => new Date();
export const getCountFromServer = async () => ({ data: () => ({ count: 0 }) });
export const limit = () => null;

// Firebase Storage compatibility functions
export const ref = () => null;
export const uploadBytesResumable = () => ({
  on: () => {},
  then: () => Promise.resolve(),
  catch: () => Promise.resolve()
});
export const getDownloadURL = async () => '';

// Timestamp compatibility
export class Timestamp {
  constructor(public seconds: number, public nanoseconds: number) {}
  
  static now() {
    return new Timestamp(Math.floor(Date.now() / 1000), 0);
  }
  
  toDate() {
    return new Date(this.seconds * 1000);
  }
  
  static fromDate(date: Date) {
    return new Timestamp(Math.floor(date.getTime() / 1000), 0);
  }
}