<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { GPSPoint, AveragedResult } from '../types/gps';
import GPSPlot from './GPSPlot.vue';

const props = defineProps<{
  isOpen: boolean;
  currentPoint: GPSPoint | null;
  windowSize: number; // User-set number of points to average
}>();

const emit = defineEmits<{
  (e: 'confirm', result: AveragedResult): void;
  (e: 'close'): void;
}>();

const pointHistory = ref<GPSPoint[]>([]);

// Watch for new points and maintain the rolling window
watch(() => props.currentPoint, (newPoint) => {
  if (newPoint && props.isOpen) {
    pointHistory.value.push(newPoint);
    if (pointHistory.value.length > props.windowSize) {
      pointHistory.value.shift();
    }
  }
});

// Compute statistics
const stats = computed(() => {
  const n = pointHistory.value.length;
  if (n === 0) return null;

  const avgLat = pointHistory.value.reduce((s, p) => s + p.latitude, 0) / n;
  const avgLon = pointHistory.value.reduce((s, p) => s + p.longitude, 0) / n;
  const avgAcc = pointHistory.value.reduce((s, p) => s + p.accuracy, 0) / n;

  // Calculate spread error (simplified meters conversion)
  const latStd = Math.sqrt(pointHistory.value.map(p => Math.pow(p.latitude - avgLat, 2)).reduce((a, b) => a + b) / n) * 111132;
  const lonStd = Math.sqrt(pointHistory.value.map(p => Math.pow(p.longitude - avgLon, 2)).reduce((a, b) => a + b) / n) * (111132 * Math.cos(avgLat * Math.PI / 180));
  
  const estimatedError = Math.sqrt(Math.pow(latStd, 2) + Math.pow(lonStd, 2) + Math.pow(avgAcc / Math.sqrt(n), 2));

  return {
    latitude: avgLat,
    longitude: avgLon,
    estimatedError,
    lastTimestamp: pointHistory.value[n - 1].timestamp
  };
});

const handleConfirm = () => {
  if (stats.value) emit('confirm', stats.value);
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">

      <div v-if="stats" class="flex flex-col items-center">
      <GPSPlot 
          :history="pointHistory" 
          :average="stats" 
          :size="200" 
      />
      
      <div class="stats-grid mt-4">
          <p><strong>Lat:</strong> {{ stats.latitude.toFixed(7) }}</p>
          <p><strong>Lon:</strong> {{ stats.longitude.toFixed(7) }}</p>
          <p><strong>Precision:</strong> ±{{ stats.estimatedError.toFixed(2) }}m</p>
      </div>
      </div>

      <h3>Position Averaging (n={{ pointHistory.length }})</h3>
      <div v-if="stats">
        <p>Lat: {{ stats.latitude.toFixed(6) }}</p>
        <p>Lon: {{ stats.longitude.toFixed(6) }}</p>
        <p>Est. Error: ±{{ stats.estimatedError.toFixed(2) }}m</p>
      </div>
      <button @click="handleConfirm" :disabled="pointHistory.length < windowSize">
        Capture Point
      </button>
      <button @click="$emit('close')">Cancel</button>
    </div>
  </div>
</template>
