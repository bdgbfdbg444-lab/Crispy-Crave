import React, { createContext, useContext, useEffect, useState } from 'react';
import { visitorTracker } from '../services/visitorTracker';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get, update, onValue } from 'firebase/database';

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
      if(user) visitorTracker.setLoggedIn(true); else visitorTracker.setLoggedIn(false);
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
            // Use onValue to continuously listen to POS updates (History, Points, Tier, etc.)
            onValue(custRef, (custSnap) => {
              if (custSnap.exists()) {
                const data = custSnap.val();
                
                // Migrate addresses logic
                let needsUpdate = false;
                if (!data.addresses) data.addresses = [];
                if (data.Address && !data.addresses.some(a => a.fullAddress === data.Address)) {
                  data.addresses.push({
                    id: Date.now().toString(),
                    label: 'المنزل',
                    fullAddress: data.Address,
                    isDefault: true
                  });
                  needsUpdate = true;
                }
                if (needsUpdate) {
                  import('firebase/database').then(({ update }) => {
                    update(custRef, { addresses: data.addresses }).catch(err => console.error("Address migration failed:", err));
                  });
                }
                
                setCustomerData(data);
              } else {
                setCustomerData(null);
              }
            });
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
    let targetPhone = phoneToFetch || userPhone;
    if (!targetPhone && auth.currentUser) {
      try {
        const mappingSnap = await get(ref(db, `UidToPhone/${auth.currentUser.uid}`));
        if (mappingSnap.exists()) {
          targetPhone = mappingSnap.val();
        }
      } catch (e) {}
    }
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
      } else {
        setCustomerData({
          Name: auth.currentUser?.displayName || 'العميل',
          Phone: targetPhone,
          Points: 0,
          History: []
        });
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

