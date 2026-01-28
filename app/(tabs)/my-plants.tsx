import React, { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { addPlant, deletePlant, initDb, listPlants, Plant, waterPlantNow } from "../../db/plantDb";

function daysFromNow(iso: string, intervalDays: number) {
  const last = new Date(iso).getTime();
  const next = last + intervalDays * 24 * 60 * 60 * 1000;
  return new Date(next);
}

export default function MyPlantsScreen() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [interval, setInterval] = useState("7");

  const refresh = () => setPlants(listPlants());

  useEffect(() => {
    initDb();
    refresh();
  }, []);

  const onAdd = () => {
    const wateringIntervalDays = Number(interval);
    if (!name.trim()) return Alert.alert("Name required", "Please enter a plant name.");
    if (!Number.isFinite(wateringIntervalDays) || wateringIntervalDays <= 0) {
      return Alert.alert("Invalid interval", "Use a positive number of days.");
    }

    addPlant({
      name: name.trim(),
      species: species.trim() ? species.trim() : null,
      wateringIntervalDays,
      lastWateredAt: new Date().toISOString(), // start “today”
    });

    setName("");
    setSpecies("");
    setInterval("7");
    refresh();
  };

  return (
    <View style={[styles.container, { backgroundColor: "white"}]}>
      <Text style={styles.title}>Add a plant</Text>

      <View style={styles.formRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Plant name"
          style={styles.input}
        />
        <TextInput
          value={species}
          onChangeText={setSpecies}
          placeholder="Species (optional)"
          style={styles.input}
        />
        <TextInput
          value={interval}
          onChangeText={setInterval}
          placeholder="Water every (days)"
          keyboardType="number-pad"
          style={styles.input}
        />

        <Pressable style={styles.primaryBtn} onPress={onAdd}>
          <Text style={styles.btnText}>Add</Text>
        </Pressable>
      </View>

      <Text style={[styles.title, { marginTop: 16 }]}>Your plants</Text>

      <FlatList
        data={plants}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          const next = daysFromNow(item.lastWateredAt, item.wateringIntervalDays);

          const due = next.getTime() <= Date.now();

          return (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  {item.name} {item.species ? `• ${item.species}` : ""}
                </Text>
                <Text style={styles.cardSub}>
                  Water every {item.wateringIntervalDays} day(s)
                </Text>
                <Text style={[styles.cardSub, due && { fontWeight: "700" }]}>
                  Next watering: {next.toDateString()} {due ? "(DUE)" : ""}
                </Text>
              </View>

              <View style={styles.cardActions}>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => {
                    waterPlantNow(item.id);
                    refresh();
                  }}
                >
                  <Text style={styles.btnText}>Watered</Text>
                </Pressable>

                <Pressable
                  style={[styles.dangerBtn, { marginTop: 8 }]}
                  onPress={() => {
                    Alert.alert("Delete plant?", "This cannot be undone.", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                          deletePlant(item.id);
                          refresh();
                        },
                      },
                    ]);
                  }}
                >
                  <Text style={styles.btnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8, backgroundColor: "white" },
  title: { fontSize: 18, fontWeight: "700" },
  formRow: { gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
  },
  primaryBtn: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "black",
    alignItems: "center",
  },
  secondaryBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#333",
    alignItems: "center",
  },
  dangerBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#b00020",
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "700" },
  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  cardSub: { fontSize: 13, opacity: 0.75, marginTop: 2 },
  cardActions: { justifyContent: "center" },
});
