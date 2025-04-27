import { useEffect, useState } from "react";
import { userApiService } from "@/services/user-api-service";
import { User } from "@/interfaces/user-interface";
import { useRouter } from "next/navigation";

export function useUser() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/auth");
        return;
      }

      try {
        const dec = parseJwt(token);
        const res = await userApiService.getById(dec._id.toString()); // using the Axios instance
        setUser(res.data.data.user);
      } catch (error: any) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          router.replace("/auth");
        } else {
          console.error("Error fetching user:", error);
          router.replace("/auth");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const logout = () => {
    localStorage.removeItem("token");
    router.replace("/auth");
  };

  return { user, loading, logout };
}

const parseJwt = (token): any => {
  var base64Url = token.split(".")[1];
  var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  var jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );

  return JSON.parse(jsonPayload);
};
