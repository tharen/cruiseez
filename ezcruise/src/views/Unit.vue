<script setup lang="ts">
  import L from 'leaflet';
  import '@geoman-io/leaflet-geoman-free';
  import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
  import 'leaflet/dist/leaflet.css';
  import * as turf from '@turf/turf';
// import type { Feature, Polygon } from 'geojson';

  import { ref, onMounted, onUnmounted } from 'vue'
  import { dbGet, dbPut, dbDel, debounce } from '../db.ts';
  import type { Unit, Tree} from '../types/api.ts'

  const props = defineProps(['navData'])
  const emit = defineEmits(['update-title','nav'])

  const unit = ref<Unit>();

  let map: L.Map;
  let drawnItems: L.FeatureGroup;
  let home = { lat: 44.2, lng: -120.5583, zoom: 7}

  const initMap = () => {
      const currentUnit = unit.value;
      if (!currentUnit) return;

      map = L.map("map", {
        zoomSnap: 0.2,
        zoomDelta: 0.2,
        wheelPxPerZoomLevel: 150
      }).setView([home.lat, home.lng], home.zoom);

      const osmLayer: L.TileLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        // attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
      const imageryLayer: L.TileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        // attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });

      const baseLayers: Record<string, L.TileLayer> = {
          "OpenStreetMap": osmLayer,
          "World Imagery": imageryLayer
      };

      const layerControl = L.control.layers(baseLayers);
      layerControl.addTo(map);

      // Handle Active layer persistence
      const active_layer_raw = localStorage.getItem('active_layer');
      const active_layer: string | null = active_layer_raw ? JSON.parse(active_layer_raw) : null;
      if (active_layer) {
        Object.keys(baseLayers).forEach(function(key) {
          if (active_layer === key) {
            console.log('restore active_layer: ', key);
            baseLayers[key].addTo(map);
          }
        });
      } else {
        osmLayer.addTo(map);
      }

      // Geoman layer for the unit polygon
      drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      map.pm.setGlobalOptions({ 
          layerGroup: drawnItems,
      });

      map.pm.setGlobalOptions({ tooltips: false });

      const handleEdit = (): void => {
          currentUnit.polygon = drawnItems.toGeoJSON();
          currentUnit.gross_area = (turf.area(currentUnit.polygon)/4046.86);
          currentUnit.polygon_edited_timestamp = Date.now();
          currentUnit.polygon_edited_by = "user"; // Placeholder for user identification
          save();
      };

      const bindEvents = (layer: L.Layer): void => {
          layer.on('pm:edit', handleEdit);
          layer.on('pm:dragend', handleEdit);
          layer.on('pm:cut', handleEdit);
      };

      if (currentUnit.polygon) {
          const polygonLayer = L.geoJSON(currentUnit.polygon);
          polygonLayer.eachLayer((layer: L.Layer) => {
              drawnItems.addLayer(layer);
              bindEvents(layer);
          });

          const bounds = drawnItems.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(drawnItems.getBounds());
            home.lat = drawnItems.getBounds().getCenter().lat;
            home.lng = drawnItems.getBounds().getCenter().lng;
            home.zoom = map.getZoom();
            map.setView([home.lat, home.lng], home.zoom);
          }
      }

      map.pm.addControls({
          position: 'topleft',
          drawMarker: false,
          drawCircleMarker: false,
          drawPolyline: false,
          drawRectangle: false,
          drawCircle: false,
          drawText: false,
          editMode: true,
          dragMode: false,
          cutPolygon: false,
          removalMode: true,
          rotateMode: false,
          drawPolygon: drawnItems.getLayers().length === 0
      });

      map.on('pm:create', (e: any) => {
          drawnItems.clearLayers();
          drawnItems.addLayer(e.layer);
          bindEvents(e.layer);
          handleEdit();
          map.pm.addControls({ drawPolygon: false });
      });

      map.on('pm:remove', (e: any) => {
          if (confirm("Delete Polygon?")) { // The layer is already removed by geoman, this is for confirmation
              currentUnit.polygon = null;
              currentUnit.gross_area = 0.0;
              currentUnit.polygon_edited_timestamp = Date.now();
              currentUnit.polygon_edited_by = "user"; // Placeholder for user identification
              save();
              map.pm.addControls({ drawPolygon: true });
          } else {
              // If deletion is cancelled, add the layer back to the map
              drawnItems.addLayer(e.layer);
          }
      });

      // Store the user preference for the last selected base layer
      map.on('baselayerchange', (e: L.LayersControlEvent) => {
        // Object.keys(baseLayers).forEach(function(key) {
        //   if (map.hasLayer(baseLayers[key])) {
        //     console.log('save active_layer: ' + key);
        //     localStorage.setItem('active_layer', JSON.stringify(key));
        //   }
        // })
        localStorage.setItem('active_layer', JSON.stringify(e.name));
      })
  };

  onMounted(async () => {
      emit('update-title', 'Unit');
      const data = await dbGet('units', props.navData.uid);
      unit.value = data as Unit;
      setTimeout(initMap, 50); // delay to ensure element mounts
  });

  onUnmounted(() => {
    if (map) map.remove(); 
  });

  const del = async () => {
    if (!unit.value) return; // Check if unit.value exists
    if (confirm("Delete unit?")) {
        await dbDel("units", unit.value.uid);
        emit('nav', {view:'units'});
    }
  };

  const download = (text: string, name: string) => {
      const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text])); a.download=name; a.click();
  };

  const exportJSON = () => {
      if (!unit.value) return; // Check if unit.value exists
      const download = (text: string, name: string) => {
          const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text])); a.download=name; a.click();
      };
      download(JSON.stringify(unit.value,null,2), "unit.json");
  };

  const exportCSV = () => {
    const currentUnit = unit.value;

    if (!currentUnit) return; // Check if unit.value exists

    let rows=["unit,project,plot,design,tree,condition,species,count,diameter,form_point,form_factor,tdf,bole_height,total_height,crown_ratio,position,damage_1,severity_1,damage_2,severity_2,log_number,grade,bole_height,length,small_diam,large_diam,def_type,def_amt,gross_cuft,gross_bdft,net_cuft,net_bdft"];
    (currentUnit.plots || []).forEach(pl=>{ 
      (pl.trees || [] as Tree[]).forEach(t=>{ 
        if (t.segments && t.segments.length > 0) { 
          t.segments.forEach(l=>{ 
            rows.push([
              currentUnit.name,currentUnit.project_name,
              pl.plot_num,pl.crew,t.designCode,t.number,t.condition,
              t.species,t.count,t.diameter,t.form_point,
              t.form_factor,t.tdf,t.bole_height,t.total_height,
              t.crown_ratio,t.position,t.damage_1,t.severity_1,
              t.damage_2,t.severity_2,l.position,l.grade,l.bole_height,
              l.length,l.small_diam,l.large_diam,l.def_type,l.def_amt,
              l.gross_cuft,l.gross_bdft,l.net_cuft,l.net_bdft
            ].join(",")); 
          }); 
        } else { 
          rows.push([
            currentUnit.name,currentUnit.project_name,
            pl.plot_num,pl.crew,t.designCode,t.number,t.condition,
            t.species,t.count,t.diameter,t.form_point,t.form_factor,
            t.tdf,t.bole_height,t.total_height,t.crown_ratio,t.position,
            t.damage_1,t.severity_1,t.damage_2,t.severity_2,
            "","","","","","","","","","",""
          ].join(",")); 
        } 
      }); 
    });
    download(rows.join("\n"), "inventory.csv");
  };

  const validate = (e: Event) => {
    const targ = e.target as HTMLInputElement
    if (!targ) return;
    const name = targ.name;
    // console.log(name);
    if (name==='net_area'){
      targ.value = targ.value;
    }
  }

  const save = debounce(() => {
    if (unit.value) dbPut("units", JSON.parse(JSON.stringify(unit.value)));
  }, 500);

</script>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 100%;
  /* background: blue; */
}

.unit-detail {
  padding: 0px;
  margin: 1px;
  /* margin-bottom: 8px; */

  background:#cccccc;
}

#map {
  flex-grow: 1;
  width: 100%;
}

</style>

<template>
  <div v-if="unit" class="view">
    <div class="unit-detail">
      <div class="flex-row">
        <div class="floating-label">
          <input placeholder=" " v-model.trim="unit.name" @input="save">
          <label>Unit</label>
        </div>
        <div class="floating-label">
          <input placeholder=" " v-model.trim="unit.project_name" @input="save">
          <label>Project</label>
        </div>
        <div class="floating-label">
          <input placeholder=" " v-model.trim="unit.project_id" @input="save">
          <label>Project ID</label>
        </div>
        <div class="floating-label">
          <input placeholder=0.0 v-model.number="unit.gross_area" type="text" pattern="\d*\.\d" readonly>
          <label>Gross Area</label>
        </div>
        <div class="floating-label">
          <input
            placeholder="0.0"
            v-model.number="unit.net_area"
            name="net_area"
            pattern="\d{1,3}.\d{1,2}"
            @input="validate"
            @blur="save"
            >
          <label>Net Area</label>
        </div>
      </div>
      <div class="floating-label">
        <textarea placeholder=" " v-model="unit.notes" @input="save"></textarea>
        <label>Notes</label>
      </div>
    </div>
    <div id="map"></div>
    <div class="actions">
      <button @click="$emit('nav', {view:'plots', uid:unit.uid})">Plots</button>
      <button @click="$emit('nav', {view:'designs', uid:unit.uid})">Designs</button>
    </div>
    <Teleport to="#teleport-menu">
      <a href="#" @click="exportJSON">Export JSON</a>
      <a href="#" @click="exportCSV">Export CSV</a>
      <a href="#" class="danger push-right" @click="del">Delete Unit</a>
    </Teleport>
</div>
</template>