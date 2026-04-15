export interface Setup {
  user_name: string;
  gps_avg_time: number;
}

export interface Design {
  uid: string;
  code: string;
  method: string;
  size: number;
  min_dbh: number | null;
  max_dbh: number | null;
  description: string;
  form_point: number | null;
}

export interface Plot {
  uid: string;
  plot_num: number;
  crew: string;
  status: string;
  slope: number | null;
  aspect: number | null;
  elevation: number | null;
  notes: string | null;
  planned_lat: number | null;
  planned_lon: number | null;
  gps_lat: number | null;
  gps_lon: number | null;
  gps_accuracy: number | null;
  gps_timestamp: number | null;
  gps_n_points: number | null;
  trees: Tree[]; // Assuming trees is an array of objects, adjust if known
}

export interface Unit {
  uid: string;
  name: string;
  project_id: string;
  project_name: string;
  gross_area: number | null;
  net_area: number | null;
  notes: string | null;
  polygon: any; // Adjust 'any' if you know the actual type of polygon
  polygon_edited_timestamp: any; // Adjust if you know the actual type
  polygon_edited_by: string;
  plots: Plot[];
  designs: Design[];
  species: Species[];
}

export interface Species {
  code: string;
  name: string;
  bark: number;
}

export interface Tree {
  uid: string;
  designCode: string;
  number: number;
  condition: string | null;
  species: string | null;
  count: number;
  diameter: number | null;
  form_point: number | null;
  form_factor: number | null;
  tdf: string | null;
  bole_height: number | null;
  total_height: number | null;
  crown_ratio: number | null;
  position: string | null;
  damage_1: string | null;
  severity_1: number | null;
  damage_2: string | null;
  severity_2: number | null;
  notes: string | null;
  segments: Segment[];
  total_cuft: number | null;
  gross_cuft: number | null;
  net_cuft: number | null;
  gross_bdft: number | null;
  net_bdft: number | null;
  defect: number | null;
}

export interface Segment {
  uid: string;
  position: number;
  length: number | null;
  sort: string | null;
  grade: string | null;
  def_type: string | null;
  def_amt: number | null;
  bole_height: number | null;
  small_diam: number | null;
  large_diam: number | null;
  gross_cuft: number | null;
  net_cuft: number | null;
  gross_bdft: number | null;
  net_bdft: number | null;
}