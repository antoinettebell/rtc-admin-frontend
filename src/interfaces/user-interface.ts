export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: "SUPER_ADMIN" | "VENDOR" | "CUSTOMER";
  requestStatus?: "PENDING" | "APPROVED" | "REJECTED";
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

export interface FoodTruck {
  _id: string;
  userId: string;
  name: string;
  facebookLink: string;
  instagramLink: string;
  logo: string | null;
  photos: string[];
  cuisine: Cuisine[];
  inactive: boolean;
  verified: boolean;
  locations: {
    title: string;
    address: string;
    lat: string;
    long: string;
    _id: string;
  }[];

  availability: [
    {
      day: string;
      locationId: string;
      startTime: string;
      endTime: string;
      available: boolean;
      _id: string;
    },
  ];
  createdAt: string;
  updatedAt: string;
  infoType: "truck" | "caterer";
}
