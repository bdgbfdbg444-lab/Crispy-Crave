import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userPhone, setUserPhone] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Find phone number linked to this UID
        try {
          const mappingRef = ref(db, `UidToPhone/${user.uid}`);
          const mappingSnap = await get(mappingRef);
          
          if (mappingSnap.exists()) {
            const phone = mappingSnap.val();
            setUserPhone(phone);
            
            // Fetch customer data
            const custRef = ref(db, `PublicCustomers/${phone}`);
            const custSnap = await get(custRef);
            if (custSnap.exists()) {
              const data = custSnap.val();
              
              // --- LAZY MIGRATION: Single Address to Multiple Addresses ---
              const legacyAddress = data.address || data.Address;
              if (legacyAddress && (!data.addresses || !Array.isArray(data.addresses) || data.addresses.length === 0)) {
                const newAddress = {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                  label: 'المنزل',
                  fullAddress: legacyAddress,
                  isDefault: true
                };
                data.addresses = [newAddress];
                // Update Firebase in the background
                update(ref(db, `PublicCustomers/${phone}`), {
                  addresses: data.addresses
                }).catch(err => console.error("Address migration failed:", err));
              }
              
              setCustomerData(data);
            }
          } else {
            setUserPhone(null);
            setCustomerData(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserPhone(null);
        setCustomerData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshCustomerData = async (phoneToFetch = null) => {
    const targetPhone = phoneToFetch || userPhone;
    if (targetPhone) {
      setUserPhone(targetPhone);
      const custRef = ref(db, `PublicCustomers/${targetPhone}`);
        const custSnap = await get(custRef);
        if (custSnap.exists()) {
          const data = custSnap.val();
          
          const legacyAddress = data.address || data.Address;
          if (legacyAddress && (!data.addresses || !Array.isArray(data.addresses) || data.addresses.length === 0)) {
            const newAddress = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
              label: 'المنزل',
              fullAddress: legacyAddress,
              isDefault: true
            };
            data.addresses = [newAddress];
            update(ref(db, `PublicCustomers/${targetPhone}`), {
              addresses: data.addresses
            }).catch(err => console.error("Address migration failed:", err));
          }
          
          setCustomerData(data);
        }
    }
  };

  const value = {
    currentUser,
    userPhone,
    setUserPhone,
    customerData,
    refreshCustomerData,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

