export interface User {
  [key: string]: any;
  _id: string;
  firstName: string;
  lastName: string;
  profilePic?: string | null;
  email: string;
  userType: "SUPER_ADMIN" | "VENDOR" | "CUSTOMER";
  requestStatus?: "PENDING" | "APPROVED" | "REJECTED";
  reasonForRejection?: string;
  countryCode?: boolean | string;
  mobileNumber?: boolean | string;
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
  capabilities?: Record<string, any>;
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
  zipcode?: string;
  isOrderingOpen?: boolean;
}

export interface FoodTruckDocument {
  _id: string;
  title?: string | null;
  document_type?: "PERMIT" | "LICENSE" | "INSURANCE" | "OTHER" | string;
  file_url: string;
  file_key?: string | null;
  original_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  uploaded_by_user_id?: string | null;
  uploaded_at?: string;
  document_status?: "ACTIVE" | "ARCHIVED" | string;
  archived_at?: string | null;
  archived_reason?: string | null;
  archived_by_user_id?: string | null;
  replaced_by_file_key?: string | null;
}

export interface FoodTruckTruckUnitOpenLocation {
  locationId: string;
  isOrderingOpen?: boolean;
  updated_at?: string;
}

export interface FoodTruckTruckUnit {
  _id?: string;
  name?: string | null;
  phone?: string | null;
  display_order?: number;
  is_primary?: boolean;
  is_archived?: boolean;
  archived_at?: string | null;
  open_locations?: FoodTruckTruckUnitOpenLocation[];
}

export interface BusinessHours {
  available: boolean;
  endTime: string;
  startTime: string;
  locationId: string;
  _id: string;
}

export interface FoodTruck {
  [key: string]: any;
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
  currentLocation?: string | null;
  food_truck_count?: number;
  documents?: FoodTruckDocument[];
  truck_units?: FoodTruckTruckUnit[];
  locations: FoodTruckLocation[];
  availability: FoodTruckAvailability[];
  createdAt: string;
  updatedAt: string;
  ssn?: string;
  snn?: string;
  ein?: string;
  infoType: "truck" | "caterer" | string;
  businessHours: BusinessHours[];
}

export interface VendorEmployee {
  _id: string;
  employee_internal_id: string;
  vendor_user_id: string;
  food_truck_id: string;
  assigned_location_id: string;
  first_name: string;
  last_name: string;
  zip_code: string;
  employee_login_id: string;
  role: "EMPLOYEE";
  is_active: boolean;
  is_working: boolean;
  is_archived: boolean;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
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
  discountType: "PERCENTAGE" | "FIXED" | "BOGO" | "BOGOHO" | null;
  bogoItems?: {
    name?: string;
    description?: string;
    imgUrls?: string[];
    price?: number;
    halfPrice?: number;
    qty: number;
    total?: number;
  }[];
  minQty: number;
  maxQty: number;
  available: boolean;
  hasFlavors?: boolean;
  flavors?: string[];
  flavorsPerOrder?: number;
  comboSideOptions?: string[];
  comboSidesPerOrder?: number;
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
  menuItemId?: string;
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
  skippedNewDishHighlightCount?: number;
  failedCount: number;
  errors: MenuCsvImportError[];
}

export interface SiteSetting {
  termsConditions: string | null;
  privacyPolicy: string | null;
  agreement: string | null;
  // Free Loyalty Bucks feature
  freeDessertAmount?: number;
  freeDessertOrderCount?: number;
  isFreeDessertEnabled?: boolean;
}

export interface Coupon {
  _id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  maxDiscount?: number | null;
  usageLimit: "NOLIMIT";
  fundedBy?: "APP" | "VENDOR";
  status?: "ACTIVE" | "ARCHIVED";
  validFrom?: string | null;
  validTill?: string | null;
  adminCreated?: boolean;
  isActive: boolean;
  archivedAt?: string | null;
  usageCount?: number;
  lastUsedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  [key: string]: any;
  _id: string;
  foodTruckId: string;
  userId: string;
  locationId?: string;
  availability: FoodTruckAvailability;
  deliveryTime: string;
  items: {
    menuItemId: string;
    qty: number;
    price: number;
    total: number;
    selectedFlavors?: string[];
    _id: string;
    menuItem: MenuItem;
  }[];
  subTotal: number;
  subtotal?: number;
  discount: number;
  taxAmount: number;
  tax?: number;
  deliveryFee?: number;
  tip?: number;
  tips?: number;
  tipsAmount?: number;
  totalOrderCost?: number;
  total: number;
  paymentProcessingFee: number;
  paymentMethod?:
    | "COD"
    | "CASH"
    | "APPLE_PAY"
    | "GOOGLE_PAY"
    | "CARD"
    | "TAP_TO_PAY"
    | "STRIPE";
  paymentStatus?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  orderSource?: "CUSTOMER_APP" | "VENDOR_POS";
  guestCustomer?: {
    phone?: string | null;
  };
  transactionId?: string | null;
  refundTransactionId?: string | null;
  refundDateTime?: string | null;
  refundStatus?: "PENDING" | "SUCCESS" | "FAILED" | null;
  refundMode?: "VOID" | "REFUND" | null;
  refundReason?: string | null;
  discountType?: string;
  fulfillmentType?: "PICKUP" | "DELIVERY";
  deliveryAddress?: string | null;
  shipdayOrderCreatedAt?: string | null;
  shipdayResponse?: Record<string, unknown> | null;
  shipdayError?: Record<string, unknown> | null;
  orderNumber?: number;
  orderStatus:
    | "INITIATE"
    | "CANCEL"
    | "PLACED"
    | "ACCEPTED"
    | "REJECTED"
    | "PREPARING"
    | "READY_FOR_PICKUP"
    | "DRIVER_PICKED_UP"
    | "DELIVERED"
    | "COMPLETED";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  foodTruck: FoodTruck;
  vendor: User;
  user: User;
}

export interface Banner {
  [key: string]: any;
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  adVendorName?: string;
  adDestinationUrl?: string;
  adImpressions?: number;
  adClicks?: number;
  adClickThroughRate?: number;
  isActive?: boolean;
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
  [key: string]: any;
  _id: string;
  title: string;
  description: string;
  recipientType: "ALL_USERS" | "ALL_VENDORS" | "ALL_CUSTOMERS";
  sentTo: string[];
  createdAt: string;
  updatedAt: string;
}
