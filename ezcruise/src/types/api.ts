export interface Setup {
  user_name: string;
  gps_avg_time: number;
}

export interface Design {
  uid: string;
  code: string;
  method: string;
  size: number;
  min_dbh: number;
  max_dbh: number;
  description: string;
  form_point: number
}

export interface Plot {
  uid: string;
  plot_num: number;
  crew: string;
  status: string;
  slope: number;
  aspect: number;
  elevation: number;
  notes: string;
  planned_lat: number;
  planned_lon: number;
  gps_lat: number;
  gps_lon: number;
  gps_accuracy: number;
  gps_timestamp: number;
  gps_n_points: number;
  trees: Tree[]; // Assuming trees is an array of objects, adjust if known
}

export interface Unit {
  uid: string;
  name: string;
  project_id: string;
  project_name: string;
  gross_area: number;
  net_area: number;
  notes: string;
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
  condition: string;
  species: string;
  count: number;
  diameter: number;
  form_point: number;
  form_factor: number;
  tdf: string;
  bole_height: number;
  total_height: number;
  crown_ratio: number;
  position: string;
  damage_1: string;
  severity_1: number;
  damage_2: string;
  severity_2: number;
  notes: string;
  segments: Segment[];
  total_cuft: number;
  gross_cuft: number;
  net_cuft: number;
  gross_bdft: number;
  net_bdft: number;
  defect: number;
}

export interface Segment {
  uid: string;
  position: number;
  length: number;
  sort: string;
  grade: string;
  def_type: string;
  def_amt: number;
  bole_height: number;
  small_diam: number;
  large_diam: number;
  gross_cuft: number;
  net_cuft: number;
  gross_bdft: number;
  net_bdft: number;
}