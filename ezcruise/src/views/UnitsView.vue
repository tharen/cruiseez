<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dbGetAll, dbAdd, uid } from '../db';
import type { Unit } from '../types/api';
import { defaultSpecies } from '../db';

const emit = defineEmits(['update-title','nav'])

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
    await dbAdd("units", {
      uid: uid(), name: "", project_id: "", project_name: "", 
      gross_area: "", net_area: "", notes: "", 
      polygon: null, polygon_edited_timestamp: null, polygon_edited_by: "", 
      plots: [], designs: [], species: { ...defaultSpecies } });
    load();
};

</script>

<style scoped>
  .card {
    background: var(--input-bg, #fffefe);
  }
</style>

<template>
  <div>
    <div class="">
      <div v-for="u in units" :key="u.uid" class="card" @click="$emit('nav', {view:'unit', uid:u.uid})" style="cursor: pointer;">
        <div class="">
          <h3>Project: {{ u.project_name || '<project>' }}</h3><h3>Unit: {{ u.name || '<unit>' }}</h3>
          <!--<h3>UID: {{ u.uid || '<uid>' }}</h3>-->
          <small>{{ u.net_area || '--' }} acres | {{ u.plots ? u.plots.length : 0 }} plots</small>
        </div>
        <div class="actions" style="justify-content: flex-start">
          <button @click="$emit('nav', {view:'plots', uid:u.uid})">Plots</button>
          <button @click="$emit('nav', {view:'designs', uid:u.uid})">Design</button>
        </div>
      </div>
    </div>
    <button @click="addUnit">+ New Unit</button>
  </div>
</template>
