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
}
