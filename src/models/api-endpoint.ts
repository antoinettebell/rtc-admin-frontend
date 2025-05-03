enum APIVersion {
  V1 = "/api/v1",
}
enum APIPath {
  AUTH = "auth",
  USER = "user",
}

export enum APIEndpoint {
  AUTH = `${APIVersion.V1}/${APIPath.AUTH}`,
  LOGIN = `${APIVersion.V1}/${APIPath.AUTH}/admin-login`,
  USER = `${APIVersion.V1}/${APIPath.USER}`,
}
