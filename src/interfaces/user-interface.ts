export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: "SUPER_ADMIN" | "VENDOR" | "CUSTOMER";
  countryCode?: boolean;
  mobileNumber?: boolean;
  inactive?: boolean;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
