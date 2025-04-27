export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: "SUPER_ADMIN" | "VENDOR" | "CUSTOMER";
  inactive?: boolean;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
