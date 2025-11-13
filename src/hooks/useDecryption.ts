import { useEffect, useMemo, useState } from "react";
import { decryptFields, isEncrypted } from "@/utils/encryption";

export interface BankDetails {
  _id?: string;
  userId?: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  remittanceEmail: string;
  currency: string;
  swiftCode: string;
  iban: string;
  paymentMethod: string;
  accountType: "CHECKING" | "SAVINGS";
  createdAt?: string;
  updatedAt?: string;
}

export function useDecryption<T extends Record<string, any>>(
  data: T | null,
  fieldsToDecrypt: (keyof T)[],
  secretKey: string,
) {
  const [decryptedData, setDecryptedData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEncryptedData, setHasEncryptedData] = useState(false);

  // 🔹 Memoize the fields array to avoid new reference every render
  const stableFields = useMemo(() => fieldsToDecrypt, []);

  useEffect(() => {
    if (!data || !secretKey) {
      setDecryptedData(data);
      setHasEncryptedData(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if any fields are encrypted
      const encrypted = stableFields.some((field) => {
        const value = data[field];
        return value && typeof value === "string" && isEncrypted(value);
      });

      setHasEncryptedData(encrypted);

      if (!encrypted) {
        setDecryptedData(data);
      } else {
        const decrypted = decryptFields(data, stableFields, secretKey);
        setDecryptedData(decrypted);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Decryption failed:", message);

      setError("Failed to decrypt data");
      setDecryptedData(data); // Fallback to raw data
    } finally {
      setLoading(false);
    }
  }, [data, secretKey, stableFields]);

  return {
    decryptedData,
    loading,
    error,
    hasEncryptedData,
  };
}

/**
 * Specialized hook for bank details decryption
 */
export function useBankDetailsDecryption(bankDetails: BankDetails | null) {
  const secretKey = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET_KEY || "";

  const fieldsToDecrypt: (keyof BankDetails)[] = [
    "accountHolderName",
    "bankName",
    "accountNumber",
    "routingNumber",
    "accountType",
    "remittanceEmail",
    "currency",
    "swiftCode",
    "iban",
    "paymentMethod",
  ];

  return useDecryption(bankDetails, fieldsToDecrypt, secretKey);
}
