import { supabase } from "../config/supabase.js";

const DEFAULT_OFFICE = {
  id: "LOC001",
  name: "Kantor Pusat",
  latitude: -7.9338,
  longitude: 112.6099,
  radiusmeter: 50.0,
};

export async function getPrimaryOffice() {
  try {
    const { data, error } = await supabase
      .from("office_locations")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_OFFICE;
    }

    return {
      id: data.id,
      name: data.name,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      radiusmeter: Number(data.radiusmeter ?? 50),
    };
  } catch (e) {
    console.warn("Using default office fallback:", e);
    return DEFAULT_OFFICE;
  }
}

export async function getAllOffices() {
  const { data, error } = await supabase
    .from("office_locations")
    .select("*")
    .order("name");

  if (error) throw error;
  return data || [];
}
