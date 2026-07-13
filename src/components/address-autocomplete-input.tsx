"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

type AddressSelection = {
  address: string;
  lat: string;
  long: string;
  zipcode: string;
};

type AddressLookupResult =
  | { ok: true; selection: AddressSelection }
  | { ok: false; reason: "missing_key" | "maps_unavailable" | "not_found" };

type AddressAutocompleteInputProps = {
  value: string;
  placeholder?: string;
  className?: string;
  onValueChange: (value: string) => void;
  onAddressSelect: (selection: AddressSelection) => void;
};

declare global {
  interface Window {
    google?: any;
    __rtcGoogleMapsPromise?: Promise<void>;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "rtc-google-maps-places";

function loadGoogleMapsPlaces() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__rtcGoogleMapsPromise) return window.__rtcGoogleMapsPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.resolve();

  window.__rtcGoogleMapsPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      GOOGLE_MAPS_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return window.__rtcGoogleMapsPromise;
}

function getAddressPart(place: any, type: string) {
  const component = place.address_components?.find((item: any) =>
    item.types?.includes(type),
  );
  return component?.long_name || "";
}

export async function geocodeAddress(
  address: string,
  zipcode?: string,
): Promise<AddressLookupResult> {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return { ok: false, reason: "missing_key" };
  }

  await loadGoogleMapsPlaces();

  if (!window.google?.maps?.Geocoder) {
    return { ok: false, reason: "maps_unavailable" };
  }

  const query = [address, zipcode].filter(Boolean).join(", ");
  const geocoder = new window.google.maps.Geocoder();

  return new Promise((resolve) => {
    geocoder.geocode(
      {
        address: query,
        componentRestrictions: { country: "US" },
      },
      (results: any[], status: string) => {
        if (status !== "OK" || !results?.[0]) {
          resolve({ ok: false, reason: "not_found" });
          return;
        }

        const place = results[0];
        const lat = place.geometry?.location?.lat?.();
        const lng = place.geometry?.location?.lng?.();

        if (!place.formatted_address || lat == null || lng == null) {
          resolve({ ok: false, reason: "not_found" });
          return;
        }

        resolve({
          ok: true,
          selection: {
            address: place.formatted_address,
            lat: String(lat),
            long: String(lng),
            zipcode: getAddressPart(place, "postal_code") || zipcode || "",
          },
        });
      },
    );
  });
}

export function AddressAutocompleteInput({
  value,
  placeholder = "Address",
  className,
  onValueChange,
  onAddressSelect,
}: AddressAutocompleteInputProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    let listener: any;
    let cancelled = false;

    loadGoogleMapsPlaces()
      .then(() => {
        if (cancelled || !inputRef.current || !window.google?.maps?.places) {
          return;
        }

        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            componentRestrictions: { country: "us" },
            fields: ["address_components", "formatted_address", "geometry"],
            types: ["address"],
          },
        );

        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const lat = place.geometry?.location?.lat?.();
          const lng = place.geometry?.location?.lng?.();

          if (!place.formatted_address || lat == null || lng == null) {
            return;
          }

          onAddressSelect({
            address: place.formatted_address,
            lat: String(lat),
            long: String(lng),
            zipcode: getAddressPart(place, "postal_code"),
          });
        });
      })
      .catch(() => {
        // The input still works manually if Google Places cannot load.
      });

    return () => {
      cancelled = true;
      listener?.remove?.();
    };
  }, [onAddressSelect]);

  return (
    <Input
      ref={inputRef}
      value={value}
      placeholder={placeholder}
      className={className}
      onChange={(e) => onValueChange(e.target.value)}
    />
  );
}
