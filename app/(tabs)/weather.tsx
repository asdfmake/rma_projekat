import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const STORAGE_KEY_REGION = "weather:region"; // cached user input

type GeoResult = {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

type WeatherResponse = {
  current_weather?: {
    temperature: number;
    windspeed: number;
    weathercode: number;
  };
};

function formatPlace(g: GeoResult) {
  const parts = [g.name, g.admin1, g.country].filter(Boolean);
  return parts.join(", ");
}

export default function WeatherScreen() {
  const [regionInput, setRegionInput] = useState("");
  const [cachedRegion, setCachedRegion] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [geo, setGeo] = useState<GeoResult | null>(null);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);

  const hasRegion = useMemo(() => !!(cachedRegion && cachedRegion.trim()), [cachedRegion]);

  // Load cached region on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY_REGION);
        if (saved?.trim()) {
          setCachedRegion(saved);
        }
      } catch {
        // non-fatal
      }
    })();
  }, []);

  // When we have a cached region, fetch weather automatically
  useEffect(() => {
    if (!cachedRegion) return;
    void fetchAll(cachedRegion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedRegion]);

  const saveRegion = async (region: string) => {
    const value = region.trim();
    if (!value) {
      Alert.alert("Region required", "Please enter your city/region (e.g., London).");
      return;
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEY_REGION, value);
      setCachedRegion(value);
      setRegionInput("");
    } catch {
      Alert.alert("Error", "Could not save region.");
    }
  };

  const clearRegion = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_REGION);
    } finally {
      setCachedRegion(null);
      setRegionInput("");
      setGeo(null);
      setWeather(null);
    }
  };

  const geocode = async (query: string): Promise<GeoResult> => {
    // Open-Meteo Geocoding API (no key)
    const url =
      "https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=" +
      encodeURIComponent(query);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);

    const data = await res.json();
    const first = data?.results?.[0];
    if (!first) throw new Error("Region not found. Try a more specific city name.");

    return {
      name: first.name,
      admin1: first.admin1,
      country: first.country,
      latitude: first.latitude,
      longitude: first.longitude,
    };
  };

  const fetchWeather = async (lat: number, lon: number): Promise<WeatherResponse> => {
    // Open-Meteo Forecast API (no key). current_weather is quick & simple.
    const url =
      "https://api.open-meteo.com/v1/forecast?current_weather=true&timezone=auto&latitude=" +
      encodeURIComponent(String(lat)) +
      "&longitude=" +
      encodeURIComponent(String(lon));

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather fetch failed (${res.status})`);
    return (await res.json()) as WeatherResponse;
  };

  const fetchAll = async (region: string) => {
    try {
      setIsLoading(true);
      setWeather(null);
      setGeo(null);

      const g = await geocode(region);
      const w = await fetchWeather(g.latitude, g.longitude);

      setGeo(g);
      setWeather(w);
    } catch (e: any) {
      Alert.alert("Weather error", e?.message ?? "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather</Text>

      {!hasRegion ? (
        <View style={styles.card}>
          <Text style={styles.subtitle}>Where are you?</Text>
          <TextInput
            value={regionInput}
            onChangeText={setRegionInput}
            placeholder="Enter city/region (e.g., Berlin)"
            autoCapitalize="words"
            style={styles.input}
          />

          <Pressable style={styles.primaryBtn} onPress={() => saveRegion(regionInput)}>
            <Text style={styles.btnText}>Save region</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.subtitle}>Saved region</Text>
          <Text style={styles.regionText}>{cachedRegion}</Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              style={[styles.secondaryBtn, isLoading && { opacity: 0.6 }]}
              onPress={() => fetchAll(cachedRegion!)}
              disabled={isLoading}
            >
              <Text style={styles.btnText}>Refresh</Text>
            </Pressable>

            <Pressable style={styles.dangerBtn} onPress={clearRegion}>
              <Text style={styles.btnText}>Change</Text>
            </Pressable>
          </View>
        </View>
      )}

      {isLoading && <ActivityIndicator style={{ marginTop: 12 }} />}

      {geo && weather?.current_weather && (
        <View style={styles.card}>
          <Text style={styles.subtitle}>Now</Text>
          <Text style={styles.placeText}>{formatPlace(geo)}</Text>

          <Text style={styles.bigTemp}>
            {Math.round(weather.current_weather.temperature)}°C
          </Text>

          <Text style={styles.metaText}>
            Wind: {Math.round(weather.current_weather.windspeed)} km/h
          </Text>

          <Text style={styles.metaText}>
            Weather code: {weather.current_weather.weathercode}
          </Text>
        </View>
      )}

      {hasRegion && !isLoading && !weather && (
        <Text style={{ opacity: 0.7, marginTop: 10 }}>
          Tap “Refresh” to load weather.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: "white" },
  title: { fontSize: 20, fontWeight: "900" },

  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  subtitle: { fontSize: 14, fontWeight: "900" },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
  },

  regionText: { fontSize: 16, fontWeight: "800" },
  placeText: { fontSize: 14, fontWeight: "800", opacity: 0.85 },

  bigTemp: { fontSize: 44, fontWeight: "900", marginTop: 4 },
  metaText: { fontSize: 13, opacity: 0.75 },

  primaryBtn: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "black",
    alignItems: "center",
  },
  secondaryBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#333",
    alignItems: "center",
  },
  dangerBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#b00020",
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "800" },
});
