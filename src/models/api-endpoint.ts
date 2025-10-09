enum APIVersion {
  V1 = "/api/v1",
}
enum APIPath {
  AUTH = "auth",
  USER = "user",
  CUISINE = "cuisine",
  CATEGORY = "category",
  MENU = "menu",
  ORDER = "order",
  SETTING = "setting",
  BANNER = "banner",
  FILE = "file",
  DIET = "diet",
  CATEGORIES = "categories",
  FOOD_TRUCK = "food-truck",
  REVIEW = "review",
  PUBLIC = "public",
}

export enum APIEndpoint {
  AUTH = `${APIVersion.V1}/${APIPath.AUTH}`,
  LOGIN = `${APIVersion.V1}/${APIPath.AUTH}/admin-login`,
  USER = `${APIVersion.V1}/${APIPath.USER}`,
  CUISINE = `${APIVersion.V1}/${APIPath.CUISINE}`,
  SETTING = `${APIVersion.V1}/${APIPath.SETTING}`,
  CATEGORY = `${APIVersion.V1}/${APIPath.CATEGORY}`,
  MENU = `${APIVersion.V1}/${APIPath.MENU}`,
  ORDER = `${APIVersion.V1}/${APIPath.ORDER}`,
  BANNER = `${APIVersion.V1}/${APIPath.BANNER}`,
  FILE = `${APIVersion.V1}/${APIPath.FILE}`,
  DIET = `${APIVersion.V1}/${APIPath.DIET}`,
  CATEGORIES = `${APIVersion.V1}/${APIPath.CATEGORIES}`,
  FOOD_TRUCK = `${APIVersion.V1}/${APIPath.FOOD_TRUCK}`,
  REVIEW = `${APIVersion.V1}/${APIPath.REVIEW}`,
  PUBLIC_PRIVACY_POLICY = `${APIVersion.V1}/${APIPath.PUBLIC}/privacy-policy`,
}
