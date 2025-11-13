"use client";

import { Suspense } from "react";
import ChangePassword from "./change-password";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChangePassword />
    </Suspense>
  );
}
