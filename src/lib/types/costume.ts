export interface TaxonomyTerm {
  id: string;
  vocabulary: string;
  label_de: string;
  parent_id: string | null;
  sort_order: number;
}

export interface CostumeMedia {
  id: string;
  costume_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
}

export interface CostumeProvenance {
  id: string;
  costume_id: string;
  production_title: string;
  year: number | null;
  season: string | null;
  actor_name: string | null;
  role_name: string | null;
  director_name: string | null;
  costume_designer: string | null;
  costume_assistant: string | null;
  is_original_production: boolean;
}

export interface CostumeItem {
  id: string;
  costume_id: string;
  theater_id: string;
  barcode_id: string;
  rfid_id: string | null;
  size_label: string | null;
  size_data: Record<string, number> | null;
  size_notes: string | null;
  condition_grade: number | null;
  current_status: string;
  storage_location_path: string | null;
  is_public_for_rent: boolean;
  updated_at: string;
}

export interface Costume {
  id: string;
  theater_id: string;
  name: string;
  description: string | null;
  gender_term_id: string | null;
  clothing_type_id: string | null;
  parent_costume_id: string | null;
  is_ensemble: boolean;
  created_at: string;
  // Joined relations
  gender_term?: TaxonomyTerm | null;
  clothing_type?: TaxonomyTerm | null;
  costume_media?: CostumeMedia[];
  costume_provenance?: CostumeProvenance[];
  costume_items?: CostumeItem[];
  costume_taxonomy?: { term_id: string; taxonomy_term?: TaxonomyTerm }[];
  theater?: { id: string; name: string; slug: string; address_info?: Record<string, unknown> | null } | null;
  // For ensemble children
  children?: Costume[];
}

export interface CostumeFormData {
  name: string;
  description: string;
  gender_term_id: string;
  clothing_type_id: string;
  material_ids: string[];
  color_ids: string[];
  epoch_ids: string[];
  size_label: string;
  production_title: string;
  production_year: string;
  role_name: string;
  photo: File | null;
}
