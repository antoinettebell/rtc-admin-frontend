"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function DeleteAccountInfoPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-red-600">
              Delete Account
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Warning */}
            <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <p>
                Deleting your account is permanent. All your data will be removed
                and cannot be recovered.
              </p>
            </div>

            {/* STEP 1 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">
                Step 1: Open Account Settings
              </h3>
              <p className="text-sm text-muted-foreground">
                Go to <b>Profile</b> from the app menu.
              </p>

              <div className="flex justify-center">
                <img
                  src="/images/step-1.jpeg"
                  alt="Account settings screen"
                  className="w-full max-w-sm rounded-lg border"
                />
              </div>
            </div>

            {/* STEP 2 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">
                Step 2: Select Delete Account And Confirmation
              </h3>
              <p className="text-sm text-muted-foreground">
                Scroll down and tap on <b>Delete Account</b>. Confirm the deletion
                and a verification code will be sent to your registered email
                address.
              </p>

              <div className="flex justify-center">
                <img
                  src="/images/step-2.jpeg"
                  alt="Delete account option"
                  className="w-full max-w-sm rounded-lg border"
                />
              </div>
            </div>

            {/* STEP 3 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">
                Step 3: Verification Deletion
              </h3>
              <p className="text-sm text-muted-foreground">
                Enter the verification code and click the{" "}
                <b>Verify Code</b> button. Your account will be permanently
                removed.
              </p>

              <div className="flex justify-center">
                <img
                  src="/images/step-3.jpeg"
                  alt="Confirm delete account"
                  className="w-full max-w-sm rounded-lg border"
                />
              </div>
            </div>

            {/* What will be deleted */}
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your profile & personal data</li>
                <li>Order & activity history</li>
                <li>Other connected data</li>

              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
