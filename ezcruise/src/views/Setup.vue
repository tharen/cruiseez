<script setup lang="ts">

import { ref, onMounted } from 'vue';
import { getSetup, saveSetup } from '../db.ts';
import type { Setup } from '../types/api.ts';

const props = defineProps(['navData'])
const emit = defineEmits(['update-title','nav'])

const userName = ref('');
const gpsAvgTime = ref(5);

onMounted(async () => {
  emit('update-title', 'Setup');
  const setup = await getSetup() as Setup;
  
  if (setup) {
    userName.value = setup.user_name || '';
    gpsAvgTime.value = setup.gps_avg_time || 5;
  }
});

const save = async () => {
  await saveSetup({
    user_name: userName.value,
    gps_avg_time: gpsAvgTime.value,
  });
  alert('Settings saved!');
};
</script>

<style scoped>
.setup-view {
  background-color: #cccccc;
  width: 100%;
  max-width: 300px;
}
</style>

<template>
  <div class="setup-view">
    <div class="floating-label">
      <input placeholder=" " v-model="userName"></input>
      <label>User Name</label>
    </div>
    <div class="floating-label">
      <input placeholder=" " v-model="gpsAvgTime" type="number"></input>
      <label>GPS Averaging Time (seconds)</label>
    </div>
    <button @click="save">Save</button>
  </div>
</template>

