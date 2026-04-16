"use client";
import React from "react";
import { useBankDetailsDecryption } from "@/hooks/useDecryption";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Props {
  userData: any;
}

export const BankDetailsDisplay: React.FC<Props> = ({ userData }) => {
  // Add safety check to prevent crashes
  if (!userData) {
    return (
      <div className="pt-2 pb-4">
        <div className="text-center text-muted-foreground py-8">
          No user data available
        </div>
      </div>
    );
  }

  const {
    decryptedData: decryptedBankDetails,
    loading,
    error,
  } = useBankDetailsDecryption(userData?.bankDetail);

  if (loading) {
    return (
      <div className="pt-2 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 5xl:grid-cols-3 gap-4">
          <div className="border rounded-md p-3">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="border rounded-md p-3">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="border rounded-md p-3">
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-6 w-36" />
          </div>
          <div className="border rounded-md p-3">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="border rounded-md p-3">
            <Skeleton className="h-4 w-22 mb-2" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-2 pb-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}. Bank details may be displayed in encrypted format.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!decryptedBankDetails) {
    return (
      <div className="pt-2 pb-4">
        <div className="text-center text-muted-foreground py-8">
          No bank details available
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 5xl:grid-cols-3 gap-4">
        <div className="border rounded-md px-3 py-2 flex items-center gap-3">
          <div className="w-full">
            <div className="text-sm text-muted-foreground">Account Holder</div>
            <div className="font-semibold truncate">
              {decryptedBankDetails.accountHolderName || "-"}
            </div>
          </div>
        </div>

        <div className="border rounded-md px-3 py-2 flex items-center gap-3">
          <div className="w-full">
            <div className="text-sm text-muted-foreground">Bank Name</div>
            <div className="font-semibold truncate">
              {decryptedBankDetails.bankName || "-"}
            </div>
          </div>
        </div>

        <div className="border rounded-md px-3 py-2 flex items-center gap-3">
          <div className="w-full">
            <div className="text-sm text-muted-foreground">Account Number</div>
            <div className="font-semibold truncate">
              {decryptedBankDetails.accountNumber || "-"}
            </div>
          </div>
        </div>

        <div className="border rounded-md px-3 py-2 flex items-center gap-3">
          <div className="w-full">
            <div className="text-sm text-muted-foreground">Routing Number</div>
            <div className="font-semibold truncate">
              {decryptedBankDetails.routingNumber || "-"}
            </div>
          </div>
        </div>

        <div className="border rounded-md px-3 py-2 flex items-center gap-3">
          <div className="w-full">
            <div className="text-sm text-muted-foreground">Account Type</div>
            <div className="font-semibold truncate capitalize">
              {decryptedBankDetails.accountType || "-"}
            </div>
          </div>
        </div>  
        <div className="border rounded-md px-3 py-2 flex items-center gap-3">
          <div className="w-full">
            <div className="text-sm text-muted-foreground">Remittance Email</div>
            <div className="font-semibold truncate capitalize">
              {decryptedBankDetails.remittanceEmail || "-"}
            </div>
          </div>
        </div>
        <div className="border rounded-md px-3 py-2 flex items-center gap-3">
          <div className="w-full">
            <div className="text-sm text-muted-foreground">Currency</div>
            <div className="font-semibold truncate capitalize">
              {decryptedBankDetails.currency || "-"}
            </div>
          </div>
        </div>
        <div className="border rounded-md px-3 py-2 flex items-center gap-3">
          <div className="w-full">
            <div className="text-sm text-muted-foreground">Swift Code</div>
            <div className="font-semibold truncate capitalize">
              {decryptedBankDetails.swiftCode || "-"}
            </div>
          </div>
        </div>
        <div className="border rounded-md px-3 py-2 flex items-center gap-3">
          <div className="w-full">
            <div className="text-sm text-muted-foreground">IBAN</div>
            <div className="font-semibold truncate capitalize">
              {decryptedBankDetails.iban || "-"}
            </div>
          </div>
        </div>
        <div className="border rounded-md px-3 py-2 flex items-center gap-3">
          <div className="w-full">
            <div className="text-sm text-muted-foreground">Payment Method</div>
            <div className="font-semibold truncate capitalize">
              {decryptedBankDetails.paymentMethod || "-"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
