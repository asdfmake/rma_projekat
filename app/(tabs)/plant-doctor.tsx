import { Asset } from "expo-asset";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type DoctorResponse = {
  diagnosis: string;
  tips?: string[];
};

const BACKEND_URL = "https://YOUR_BACKEND_HOST/plant-doctor";

const EXAMPLES = [
  {
    id: "apple_healthy",
    label: "apple_healthy spots",
    source: require("../../assets/examples/apple_healthy.png"),
  },
  {
    id: "potato_early",
    label: "potato_early",
    source: require("../../assets/examples/potato_early.png"),
  },
  {
    id: "tomato_spot",
    label: "tomato_spot",
    source: require("../../assets/examples/tomato_spot.png"),
  },
] as const;

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

  const uploadImageUri = async (imageUri: string) => {
    const form = new FormData();
    form.append("image", {
      uri: imageUri,
      name: "plant.jpg",
      // If you only ever upload PNG examples you can switch based on extension,
      // but jpeg works fine for most backends even if the original is png.
      type: "image/jpeg",
    } as any);

    const res = await fetch(BACKEND_URL, {
      method: "POST",
      body: form,
      // NOTE: do NOT set Content-Type manually for FormData in RN;
      // fetch will set the boundary correctly.
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Upload failed (${res.status}). ${text}`);
    }

    return (await res.json()) as DoctorResponse;
  };

  const uploadBundledExample = async (source: number) => {
    // Ensure bundled asset is available as a local file URI
    const asset = Asset.fromModule(source);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    return uploadImageUri(uri);
  };

  const takeAndUpload = async () => {
    try {
      setResult(null);

      if (!cameraRef.current) return;
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) return;

      setIsUploading(true);
      const data = await uploadImageUri(photo.uri);
      setResult(data);
    } catch (e: any) {
      Alert.alert("Plant Doctor error", e?.message ?? "Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };

  const runExample = async (source: number) => {
    try {
      setResult(null);
      setIsUploading(true);

      const data = await uploadBundledExample(source);
      setResult(data);
    } catch (e: any) {
      Alert.alert("Plant Doctor error", e?.message ?? "Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: "white"}]}>
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

      {/* Examples */}
      <View style={{ marginTop: 4 }}>
        <Text style={styles.sectionTitle}>Try an example</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.examplesRow}
        >
          {EXAMPLES.map((ex) => (
            <Pressable
              key={ex.id}
              style={[styles.exampleCard, isUploading && { opacity: 0.6 }]}
              disabled={isUploading}
              onPress={() => runExample(ex.source)}
            >
              <Image source={ex.source} style={styles.exampleImage} />
              <Text style={styles.exampleLabel} numberOfLines={1}>
                {ex.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isUploading && <ActivityIndicator style={{ marginTop: 10 }} />}

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Diagnosis</Text>
          <Text style={styles.resultText}>{result.diagnosis}</Text>

          {!!result.tips?.length && (
            <>
              <Text style={[styles.resultTitle, { marginTop: 10 }]}>Tips</Text>
              {result.tips.map((t, idx) => (
                <Text key={idx} style={styles.resultText}>
                  • {t}
                </Text>
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
    backgroundColor: "#ffffff",
  },
  primaryBtn: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "black",
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "800" },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
  },
  examplesRow: {
    gap: 10,
    paddingRight: 8,
  },
  exampleCard: {
    width: 120,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 8,
  },
  exampleImage: {
    width: "100%",
    height: 78,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
  },
  exampleLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "800",
    opacity: 0.9,
  },

  resultCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 12,
  },
  resultTitle: { fontSize: 16, fontWeight: "900" },
  resultText: { marginTop: 6, fontSize: 14, opacity: 0.9 },
});
