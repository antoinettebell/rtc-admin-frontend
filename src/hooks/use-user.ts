import { useEffect, useState } from "react";
import { userApiService } from "@/services/user-api-service";
import { User } from "@/interfaces/user-interface";
import { useRouter } from "next/navigation";

type JwtPayload = {
  _id?: string;
  exp?: number;
};

export function useUser() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const clearSession = () => {
      localStorage.removeItem("token");
      if (isActive) {
        setUser(null);
      }
    };

    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        if (isActive) {
          setLoading(false);
        }
        router.replace("/auth");
        return;
      }

      try {
        const dec = parseJwt(token);
        const isExpired =
          typeof dec.exp === "number" && dec.exp * 1000 <= Date.now();

        if (!dec._id || isExpired) {
          clearSession();
          router.replace("/auth");
          return;
        }

        const res = await userApiService.getById(dec._id.toString()); // using the Axios instance
        if (isActive) {
          setUser(res.data.data.user);
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          clearSession();
          router.replace("/auth");
        } else {
          if (process.env.NODE_ENV === "development") {
            console.warn("Unable to restore user session:", error);
          }
          router.replace("/auth");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isActive = false;
    };
  }, [router]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    router.replace("/auth");
  };

  return { user, loading, logout };
}

const parseJwt = (token: string): JwtPayload => {
  try {
    const base64Url = token.split(".")[1];

    if (!base64Url) {
      return {};
    }

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );

    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
};
