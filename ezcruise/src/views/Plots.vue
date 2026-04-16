<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dbPut, dbGet, getSetup, debounce, uid } from '../db';
import type { Unit, Plot, Setup } from '../types/api';
// import { MapPinXmark } from '@iconoir/vue';

const props = defineProps(['navData'])
const emit = defineEmits(['update-title','nav'])
const save = debounce(() => { if (unit.value) dbPut("units", JSON.parse(JSON.stringify(unit.value))); }, 500);

const unit = ref<Unit>();
const setup = ref<Setup>();

interface PlotStatus {
  code: string;
  description: string
}
const plotStatus: PlotStatus[] = [
  {code:'PLAN', description:'Planned'},
  {code:'COMP', description:'Completed'},
  {code:'ROAD', description:'Dropped - Road'},
  {code:'SFTY', description:'Dropped - Safety'},
  {code:'OUT', description:'Dropped - Out'},
]

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
    plot_num:(Number(lastPlot?.plot_num) ?? 0) + 1,
    crew:lastPlot?.crew ?? "",
    status:"Planned",
    slope: null, aspect: null, elevation: null, notes: "",
    planned_lat: null, planned_lon: null, 
    gps_lat: null, gps_lon: null, gps_accuracy: null,
    gps_timestamp: null, gps_n_points: null,
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

<style scoped>
.icon-button {
  padding: 0px;
}
.icon-rotate {
  transform: rotate(90deg);
}
</style>

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
        <select v-model="plot.status" @change="save">
          <option v-for="s in plotStatus" :key="s.code" :value="s.code">{{ s.code }}</option>
        </select>
        <label>Status</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="plot.slope" @input="save" onfocus="this.select()" type="number">
        <label>Slope (%)</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="plot.aspect" @input="save" onfocus="this.select()" type="number">
        <label>Aspect (&deg)</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="plot.elevation" @input="save" onfocus="this.select()" type="number">
        <label>Elev (ft)</label>
      </div>
    </div>
    <div class="flex-row">
      <div class="floating-label">
        <input placeholder=" " v-model="plot.planned_lat" @input="save" type="number">
        <label>Plan Lat</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="plot.planned_lon" @input="save" type="number">
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
      <button class="secondary" @click="getGPS(plot)">GPS</button>
      </div>
      <button class="danger" @click="delPlot(plot.uid)">X</button>
    </div>
  </div>
  </div>
  <button @click="addPlot">+ Add Plot</button>
</div>
</template>
