import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  base64ToArrayBuffer,
  decryptMasterKey,
  decryptMessage,
  deriveKeyFromPassword,
  encryptMasterKey,
  encryptMessage,
  generateMasterKey,
  generateRecoveryKey,
  generateSalt,
} from "./crypto";

type EncryptionStatus = "unconfigured" | "locked" | "unlocked";

type EncryptionContextType = {
  status: EncryptionStatus;
  hasStoredKeys: boolean;
  initializeWithPassphrase: (passphrase: string) => Promise<{ recoveryKey: string }>;
  unlockWithPassphrase: (passphrase: string) => Promise<void>;
  lock: () => void;
  encryptText: (plaintext: string) => Promise<{ ciphertext: string; iv: string }>;
  decryptText: (ciphertext: string, iv: string) => Promise<string>;
};

type ServerKeyMaterial = {
  encryptedMasterKey: string;
  keyDerivationSalt: string;
  masterKeyIV: string;
};

const EncryptionContext = createContext<EncryptionContextType | null>(null);

export const EncryptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<EncryptionStatus>("unconfigured");
  const [hasStoredKeys, setHasStoredKeys] = useState(false);
  const [serverKeyMaterial, setServerKeyMaterial] = useState<ServerKeyMaterial | null>(null);
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const masterKeyRef = useRef<CryptoKey | null>(null);

  const baseApiUrl = import.meta.env.VITE_API_URI;

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserId(user?.id ?? null);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (!session?.user) {
        setStatus("unconfigured");
        setHasStoredKeys(false);
        setServerKeyMaterial(null);
        masterKeyRef.current = null;
        setMasterKey(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getFreshToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("No active session");
    }

    return session.access_token;
  };

  const resolveActiveUserId = async (): Promise<string> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.id) {
      if (userId !== session.user.id) {
        setUserId(session.user.id);
      }
      return session.user.id;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      throw new Error("No active user");
    }

    if (userId !== user.id) {
      setUserId(user.id);
    }
    return user.id;
  };

  const fetchKeyMaterial = async (currentUserId: string) => {
    const token = await getFreshToken();
    const res = await fetch(`${baseApiUrl}/crypto/keys/${currentUserId}`, {
      headers: {
        Authorization: `${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch encryption key metadata");
    }

    const data = await res.json();

    if (!data?.exists) {
      setHasStoredKeys(false);
      setServerKeyMaterial(null);
      setStatus("unconfigured");
      masterKeyRef.current = null;
      setMasterKey(null);
      return null;
    }

    const material: ServerKeyMaterial = {
      encryptedMasterKey: data.encryptedMasterKey,
      keyDerivationSalt: data.keyDerivationSalt,
      masterKeyIV: data.masterKeyIV,
    };

    setHasStoredKeys(true);
    setServerKeyMaterial(material);
    if (!masterKey) setStatus("locked");
    return material;
  };

  useEffect(() => {
    if (!userId) return;
    fetchKeyMaterial(userId).catch(() => {
      setHasStoredKeys(false);
      setServerKeyMaterial(null);
      setStatus("unconfigured");
    });
  }, [userId]);

  const initializeWithPassphrase = async (passphrase: string) => {
    const currentUserId = await resolveActiveUserId();
    if (!passphrase?.trim()) throw new Error("Passphrase is required");

    const token = await getFreshToken();

    const salt = generateSalt();
    const passwordKey = await deriveKeyFromPassword(passphrase, salt);
    const newMasterKey = await generateMasterKey();

    const encryptedMaster = await encryptMasterKey(newMasterKey, passwordKey);

    const recoveryKey = generateRecoveryKey();
    const recoveryDerivedKey = await deriveKeyFromPassword(recoveryKey, salt);
    const encryptedRecoveryMaster = await encryptMasterKey(newMasterKey, recoveryDerivedKey);

    const saltBase64 = btoa(String.fromCharCode(...salt));

    const res = await fetch(`${baseApiUrl}/crypto/init-keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify({
        userId: currentUserId,
        encryptedMasterKey: encryptedMaster.encryptedKey,
        keyDerivationSalt: saltBase64,
        masterKeyIV: encryptedMaster.iv,
        encryptedMasterKeyRecovery: encryptedRecoveryMaster.encryptedKey,
        recoveryKeyIV: encryptedRecoveryMaster.iv,
      }),
    });

    const responseData = await res.json();
    if (!res.ok) {
      throw new Error(responseData?.error || "Failed to initialize encryption keys");
    }

    setHasStoredKeys(true);
    setServerKeyMaterial({
      encryptedMasterKey: encryptedMaster.encryptedKey,
      keyDerivationSalt: saltBase64,
      masterKeyIV: encryptedMaster.iv,
    });
    masterKeyRef.current = newMasterKey;
    setMasterKey(newMasterKey);
    setStatus("unlocked");

    return { recoveryKey };
  };

  const unlockWithPassphrase = async (passphrase: string) => {
    const currentUserId = await resolveActiveUserId();
    if (!passphrase?.trim()) throw new Error("Passphrase is required");

    const material = serverKeyMaterial || (await fetchKeyMaterial(currentUserId));
    if (!material) {
      throw new Error("Encryption keys are not configured for this user");
    }

    const saltBytes = new Uint8Array(base64ToArrayBuffer(material.keyDerivationSalt));
    const passwordKey = await deriveKeyFromPassword(passphrase, saltBytes);
    const unlockedMasterKey = await decryptMasterKey(
      material.encryptedMasterKey,
      material.masterKeyIV,
      passwordKey
    );

    masterKeyRef.current = unlockedMasterKey;
    setMasterKey(unlockedMasterKey);
    setStatus("unlocked");
  };

  const lock = () => {
    masterKeyRef.current = null;
    setMasterKey(null);
    setStatus(hasStoredKeys ? "locked" : "unconfigured");
  };

  const encryptText = async (plaintext: string) => {
    if (!masterKeyRef.current) throw new Error("Encryption is locked");
    return encryptMessage(plaintext, masterKeyRef.current);
  };

  const decryptText = async (ciphertext: string, iv: string) => {
    if (!masterKeyRef.current) throw new Error("Encryption is locked");
    return decryptMessage(ciphertext, iv, masterKeyRef.current);
  };

  const value = useMemo(
    () => ({
      status,
      hasStoredKeys,
      initializeWithPassphrase,
      unlockWithPassphrase,
      lock,
      encryptText,
      decryptText,
    }),
    [status, hasStoredKeys, masterKey]
  );

  return <EncryptionContext.Provider value={value}>{children}</EncryptionContext.Provider>;
};

export const useEncryption = () => {
  const ctx = useContext(EncryptionContext);
  if (!ctx) {
    throw new Error("useEncryption must be used within EncryptionProvider");
  }
  return ctx;
};
