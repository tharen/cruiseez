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

<template>
  <div class="setup-view">
    <div class="form-group">
      <label for="userName">User Name</label>
      <input id="userName" type="text" v-model="userName">
    </div>
    <div class="form-group">
      <label for="gpsAvgTime">GPS Averaging Time (seconds)</label>
      <input id="gpsAvgTime" type="number" v-model.number="gpsAvgTime">
    </div>
    <button @click="save">Save</button>
  </div>
</template>

