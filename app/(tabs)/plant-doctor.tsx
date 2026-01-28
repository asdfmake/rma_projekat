import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

type DoctorResponse = {
  diagnosis: string;
  tips?: string[];
};

export default function PlantDoctorScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<DoctorResponse | null>(null);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) requestPermission();
  }, [permission, requestPermission]);

  const takeAndUpload = async () => {
    try {
      setResult(null);

      if (!cameraRef.current) return;
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });

      if (!photo?.uri) return;

      setIsUploading(true);

      // TODO: replace with your backend URL
      const url = "https://YOUR_BACKEND_HOST/plant-doctor";

      const form = new FormData();
      form.append("image", {
        uri: photo.uri,
        name: "plant.jpg",
        type: "image/jpeg",
      } as any);

      const res = await fetch(url, {
        method: "POST",
        body: form,
        headers: {
          // NOTE: do NOT set Content-Type manually for FormData in RN;
          // fetch will set the boundary correctly.
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Upload failed (${res.status}). ${text}`);
      }

      const data = (await res.json()) as DoctorResponse;
      setResult(data);
    } catch (e: any) {
      Alert.alert("Plant Doctor error", e?.message ?? "Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Checking camera permissions…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ textAlign: "center", marginBottom: 12 }}>
          Camera permission is required for Plant Doctor.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrap}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setIsCameraReady(true)}
        />
      </View>

      <Pressable
        style={[styles.primaryBtn, (!isCameraReady || isUploading) && { opacity: 0.6 }]}
        onPress={takeAndUpload}
        disabled={!isCameraReady || isUploading}
      >
        <Text style={styles.btnText}>{isUploading ? "Uploading…" : "Take photo & Diagnose"}</Text>
      </Pressable>

      {isUploading && <ActivityIndicator style={{ marginTop: 10 }} />}

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Diagnosis</Text>
          <Text style={styles.resultText}>{result.diagnosis}</Text>

          {!!result.tips?.length && (
            <>
              <Text style={[styles.resultTitle, { marginTop: 10 }]}>Tips</Text>
              {result.tips.map((t, idx) => (
                <Text key={idx} style={styles.resultText}>• {t}</Text>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  cameraWrap: {
    height: 360,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  primaryBtn: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "black",
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "800" },
  resultCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 12,
  },
  resultTitle: { fontSize: 16, fontWeight: "900" },
  resultText: { marginTop: 6, fontSize: 14, opacity: 0.9 },
});
