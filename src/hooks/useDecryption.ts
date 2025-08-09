import { useState, useEffect, useCallback } from 'react';
import { decryptFields, isEncrypted } from '@/utils/encryption';

export interface BankDetails {
  _id?: string;
  userId?: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'CHECKING' | 'SAVINGS';
  createdAt?: string;
  updatedAt?: string;
}

export function useDecryption<T extends Record<string, any>>(
  data: T | null,
  fieldsToDecrypt: (keyof T)[],
  secretKey: string
) {
  const [decryptedData, setDecryptedData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processData = useCallback(() => {
    if (!data || !secretKey) {
      setDecryptedData(data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if any fields are encrypted
      const hasEncryptedFields = fieldsToDecrypt.some(field => {
        const value = data[field];
        return value && typeof value === 'string' && isEncrypted(value);
      });

      if (!hasEncryptedFields) {
        // No encrypted fields, return original data
        setDecryptedData(data);
        setLoading(false);
        return;
      }

      // Decrypt the fields
      const decrypted = decryptFields(data, fieldsToDecrypt, secretKey);
      setDecryptedData(decrypted);
      setLoading(false);
    } catch (err) {
      console.error('Decryption failed:', err);
      setError('Failed to decrypt data');
      setDecryptedData(data); // Return original data on error
      setLoading(false);
    }
  }, [data, fieldsToDecrypt, secretKey]);

  useEffect(() => {
    processData();
  }, [processData]);

  return {
    decryptedData,
    loading,
    error,
    hasEncryptedData: decryptedData !== data
  };
}

/**
 * Specialized hook for bank details decryption
 */
export function useBankDetailsDecryption(bankDetails: BankDetails | null) {
  const secretKey = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET_KEY || '';
  
  const fieldsToDecrypt: (keyof BankDetails)[] = [
    'accountHolderName',
    'bankName',
    'accountNumber',
    'routingNumber',
    'accountType'
  ];

  return useDecryption(bankDetails, fieldsToDecrypt, secretKey);
} 