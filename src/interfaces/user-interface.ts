export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  profilePic?: string | null;
  email: string;
  userType: "SUPER_ADMIN" | "VENDOR" | "CUSTOMER";
  requestStatus?: "PENDING" | "APPROVED" | "REJECTED";
  reasonForRejection?: string;
  countryCode?: boolean;
  mobileNumber?: boolean;
  inactive?: boolean;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  foodTruck?: FoodTruck;
}

export interface Cuisine {
  _id: string;
  name: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Diet {
  _id: string;
  name: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
export interface Categoriess {
  _id: string;
  name: string;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Plan {
  _id: string;
  name: string;
  titleColor: string;
  slug: string;
  rate: number;
  rateType: string;
  isPopular: boolean;
  details: string[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FoodTruckAvailability {
  _id: string;
  day: string;
  locationId: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface FoodTruckLocation {
  _id: string;
  title: string;
  address: string;
  lat: string;
  long: string;
}

export interface BusinessHours {
  available: boolean;
  endTime: string;
  startTime: string;
  locationId: string;
  _id: string;
}

export interface FoodTruck {
  _id: string;
  userId: string;
  name: string;
  planId: string;
  plan?: Plan;
  facebookLink: string;
  instagramLink: string;
  logo: string | null;
  photos: string[];
  cuisine: Cuisine[];
  inactive: boolean;
  verified: boolean;
  featured?: boolean;
  completed?: boolean;
  locations: FoodTruckLocation[];
  availability: FoodTruckAvailability[];
  createdAt: string;
  updatedAt: string;
  ssn?: string;
  snn?: string;
  ein?: string;
  infoType: "truck" | "caterer";
  businessHours: BusinessHours[];
}

export interface MenuCategory {
  _id: string;
  name: string;
  userId: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  menuCount: number;
}

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  imgUrls: string[];
  price: number;
  discount: number;
  discountType: "PERCENTAGE" | "FIXED";
  minQty: number;
  maxQty: number;
  available: boolean;
  itemType: "COMBO" | "INDIVIDUAL";
  categoryId: string;
  subItem: {
    menuItem: Partial<MenuItem>;
    qty: number;
    _id: string;
  }[];
  userId: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: MenuCategory;
}

export interface MenuCsvImportError {
  rowNumber: number;
  menuItemName: string;
  message: string;
}

export interface MenuCsvImportSummary {
  totalRows: number;
  importedCount: number;
  createdCount: number;
  updatedCount: number;
  categoryCreatedCount: number;
  uploadedImageCount?: number;
  failedCount: number;
  errors: MenuCsvImportError[];
}

export interface SiteSetting {
  termsConditions: string | null;
  privacyPolicy: string | null;
  agreement: string | null;
  // Free Dessert feature
  freeDessertAmount?: number;
  freeDessertOrderCount?: number;
  isFreeDessertEnabled?: boolean;
}

export interface OrderItem {
  _id: string;
  foodTruckId: string;
  userId: string;
  availability: FoodTruckAvailability;
  deliveryTime: string;
  items: {
    menuItemId: string;
    qty: number;
    price: number;
    total: number;
    _id: string;
    menuItem: MenuItem;
  }[];
  subTotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  orderNumber?: number;
  orderStatus:
    | "INITIATE"
    | "CANCEL"
    | "PLACED"
    | "ACCEPTED"
    | "REJECTED"
    | "PREPARING"
    | "READY_FOR_PICKUP"
    | "COMPLETED";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  foodTruck: FoodTruck;
  vendor: User;
  user: User;
}

export interface Banner {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  fromDate: string;
  toDate: string;
  deletedAt: string;
}

export interface FileUpload {
  _id: string;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id?: string;
  userId: string;
  foodTruckId: string;
  orderId?: string;
  rate: number;
  review: string;
  images: string[];
  deletedAt: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface ReviewStats {
  reviewStats: {
    avgRate: number;
    totalReviews: number;
    star1: number;
    star2: number;
    star3: number;
    star4: number;
    star5: number;
  };
}

export interface Notification {
  _id: string;
  title: string;
  description: string;
  recipientType: "ALL_USERS" | "ALL_VENDORS" | "ALL_CUSTOMERS";
  sentTo: string[];
  createdAt: string;
  updatedAt: string;
}
