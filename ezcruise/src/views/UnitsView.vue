<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dbGetAll, dbAdd, uid } from '../db.ts';

const emit = defineEmits(['update-title','nav'])

interface Unit {
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
  plots: any[]; // Adjust if you know the actual type of plots
  designs: any[]; // Adjust if you know the actual type of designs
}

const units = ref<Unit[]>([]);
const load = async () => {
  const data = await dbGetAll('units');
  units.value = data as Unit[];
};

onMounted(() => {
    emit('update-title', 'Units');
    load();
});

const addUnit = async () => {
    await dbAdd("units", { uid: uid(), name: "", project_id: "", project_name: "", gross_area: "", net_area: "", notes: "", polygon: null, polygon_edited_timestamp: null, polygon_edited_by: "", plots: [], designs: [] });
    load();
};

</script>

<template>
  <div>
    <div class="grid">
      <div v-for="u in units" :key="u.uid" class="card" @click="$emit('nav', {view:'unit', uid:u.uid})" style="cursor: pointer;">
        <div class="grid">
          <div>
            <h3>Project: {{ u.project_name || '<project>' }}</h3>
            <h3>Unit: {{ u.name || '<unit>' }}</h3>
            <!--<h3>UID: {{ u.uid || '<uid>' }}</h3>-->
            <small>{{ u.net_area || '--' }} acres | {{ u.plots ? u.plots.length : 0 }} plots</small>
          </div>
      
          <div class="actions">
            <button @click="$emit('nav', {view:'plots', uid:u.uid})">Plots</button>
            <button @click="$emit('nav', {view:'designs', uid:u.uid})">Design</button>
          </div>
        </div>

      </div>
    </div>
    <button @click="addUnit">+ New Unit</button>
  </div>
</template>
