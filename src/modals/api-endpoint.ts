enum APIVersion {
  V1 = "/api/v1",
}
enum APIPath {
  AUTH = "auth",
  USER = "user",
}

export enum APIEndpoint {
  LOGIN = `${APIVersion.V1}/${APIPath.AUTH}`,
  USER = `${APIVersion.V1}/${APIPath.USER}`,
}
