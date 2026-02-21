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
  role_name: string | null;
}

export interface CostumeItem {
  id: string;
  costume_id: string;
  theater_id: string;
  barcode_id: string;
  size_label: string | null;
  condition_grade: number | null;
  current_status: string;
}

export interface Costume {
  id: string;
  theater_id: string;
  name: string;
  description: string | null;
  gender_term_id: string | null;
  clothing_type_id: string | null;
  created_at: string;
  // Joined relations
  gender_term?: TaxonomyTerm | null;
  clothing_type?: TaxonomyTerm | null;
  costume_media?: CostumeMedia[];
  costume_provenance?: CostumeProvenance[];
  costume_items?: CostumeItem[];
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
