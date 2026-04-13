<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dbPut, dbGet, getSetup, debounce, uid } from '../db.ts';
import type { Unit, Plot, Setup } from '../types/api.ts';

const props = defineProps(['navData'])
const emit = defineEmits(['update-title','nav'])
const save = debounce(() => { if (unit.value) dbPut("units", JSON.parse(JSON.stringify(unit.value))); }, 500);

const unit = ref<Unit>();
const setup = ref<Setup>();

onMounted(async () => {
  emit('update-title', 'Plots');
  unit.value = await dbGet('units', props.navData.uid) as Unit;
  setup.value = await getSetup() as Setup;
});

const addPlot = () => {
  // TODO: Auto increment plot_num, copy crew from previous plot
  const currentUnit = unit.value;
  if (!currentUnit) return;

  const lastPlot = currentUnit.plots[currentUnit.plots.length-1];
  
  // const nextPlot = Math.max(...currentUnit.plots.map(plot => plot.plot_num)) || 0 + 1;
  
  currentUnit.plots.push({
    uid: uid(),
    plot_num:(lastPlot?.plot_num ?? 0) + 1,
    crew:lastPlot?.crew ?? "",
    status:"Planned",
    slope: 0.0, aspect: 0.0, elevation: 0.0, notes: "",
    planned_lat: 0.0, planned_lon: 0.0, 
    gps_lat: 0.0, gps_lon: 0.0, gps_accuracy: 0.0,
    gps_timestamp: 0, gps_n_points: 0,
    trees:[]
  });
  save();
};

const delPlot = (plotId: string) => {
  if (!unit.value) return;
  if (confirm("Delete plot?")) {
    unit.value.plots = unit.value.plots.filter(x => x.uid !== plotId);
    save();
  }
};

const getGPS = (plot: Plot) => {
  // TODO: Weighted average position and accuracy, where weight is the inverse of accuracy
  // TODO: Verify that there is a value in the avg_gps_time, warn the user if not
  if (!setup.value) return;
  const gps_avg_time = setup.value.gps_avg_time;
  
  // Use a temporary ref to store collected positions
  const positions: { lat: number, lon: number, acc: number, timestamp: number }[] = [];
  let count = 0;
  let timer: number | null = null;

  const collectPosition = () => {
    if (count >= gps_avg_time) {
      // Stop watching after collecting enough points
      if (timer !== null) {
        // navigator.geolocation.clearWatch(timer);
      }
      
      if (positions.length > 0) {
        const totalLat = positions.reduce((sum, p) => sum + p.lat, 0);
        const totalLon = positions.reduce((sum, p) => sum + p.lon, 0);
        const totalAcc = positions.reduce((sum, p) => sum + p.acc, 0);
        
        // Calculate averages
        plot.gps_lat = totalLat / positions.length;
        plot.gps_lon = totalLon / positions.length;
        // Simple average accuracy (note: averaging accuracy is mathematically complex, 
        // but for simplicity, we average the reported accuracy here)
        plot.gps_accuracy = totalAcc / positions.length; 
        
        // Use the timestamp of the last successful reading
        plot.gps_timestamp = positions[positions.length - 1].timestamp;
        plot.gps_n_points = positions.length; // Add the number of points averaged
        
        save();
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        positions.push({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          acc: position.coords.accuracy,
          timestamp: Date.now()
        });
        count++;
        
        // Schedule the next collection
        timer = setTimeout(collectPosition, 1000); // Collect every second
      },
      error => {
        console.error(`GPS Error: ${error.message}`);
        // If an error occurs, stop the timer
        if (timer) {
          navigator.geolocation.clearWatch(timer);
        }
        alert(`GPS Error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0
      }
    );
  };

  // Start the collection process
  timer = setTimeout(collectPosition, 1000);
};

</script>

<template>
<div v-if="unit">
  <div class="">
  <div v-for="plot in unit.plots" :key="plot.uid" class="card">
    <div class="flex-row">
      <div class="floating-label">
        <input placeholder=" " v-model="plot.plot_num" @input="save">
        <label>Plot</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="plot.crew" @input="save">
        <label>Crew</label>
      </div>
      <div class="floating-label">
        <select v-model="plot.status" @change="save" onfocus="this.select()">
          <option value="P">Planned</option>
          <option value="C">Completed</option>
          <option value="DR">Drop - Road</option>
          <option value="DS">Drop - Safety</option>
          <option value="DO">Drop - Out</option>
        </select>
        <label>Status</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="plot.slope" @input="save" onfocus="this.select()">
        <label>Slope (%)</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="plot.aspect" @input="save" onfocus="this.select()">
        <label>Aspect (&deg)</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="plot.elevation" @input="save" onfocus="this.select()">
        <label>Elev (ft)</label>
      </div>
    </div>
    <div class="flex-row">
      <div class="floating-label">
        <input placeholder=" " v-model="plot.planned_lat" @input="save">
        <label>Plan Lat</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="plot.planned_lon" @input="save">
        <label>Plan Lon</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="plot.gps_lat" readonly>
        <label>GPS Lat</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="plot.gps_lon" readonly>
        <label>GPS Lon</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="plot.gps_accuracy" readonly>
        <label>Acc (m)</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="plot.gps_timestamp" readonly>
        <label>Time</label>
      </div>
    </div>
    <div class="floating-label">
      <textarea placeholder=" " v-model="plot.notes" @input="save"></textarea>
      <label>Notes</label>
    </div>
    <div class="actions">
      <div>
      <button @click="$emit('nav', {view:'trees', pid:unit.uid, plotId:plot.uid})">Trees</button>
      <!-- <button @click="$emit('nav', {view:'trees-card', pid:unit.uid, plotId:plot.uid})">Trees-Card</button> -->
      <button class="secondary" @click="getGPS(plot)">Get GPS</button>
      </div>
      <button class="danger" @click="delPlot(plot.uid)">X</button>
    </div>
  </div>
  </div>
  <button @click="addPlot">+ Add Plot</button>
</div>
</template>
