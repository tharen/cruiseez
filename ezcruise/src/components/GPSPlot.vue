<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  history: { latitude: number; longitude: number }[];
  average: { latitude: number; longitude: number };
  size: number; // Width/Height in pixels
}>();

const padding = 20; // SVG padding

const plotPoints = computed(() => {
  if (props.history.length === 0) return [];

  // Convert lat/lon differences to meters for a 1:1 aspect ratio plot
  const metersPerLat = 111132;
  const metersPerLon = 111132 * Math.cos(props.average.latitude * Math.PI / 180);

  const relativePoints = props.history.map(p => ({
    x: (p.longitude - props.average.longitude) * metersPerLon,
    y: (p.latitude - props.average.latitude) * metersPerLat
  }));

  // Find max range to auto-scale the view
  const maxDist = Math.max(...relativePoints.map(p => Math.sqrt(p.x**2 + p.y**2)), 2); // Min 2m scale
  const scale = (props.size / 2 - padding) / maxDist;

  return relativePoints.map(p => ({
    cx: (props.size / 2) + (p.x * scale),
    cy: (props.size / 2) - (p.y * scale) // SVG Y is down, so we subtract
  }));
});
</script>

<template>
  <div class="plot-container">
    <svg :width="size" :height="size" class="bg-gray-100 rounded-full border">
      <!-- Target Rings (e.g., 1m, 2m, 5m) -->
      <circle :cx="size/2" :cy="size/2" r="5" fill="red" /> <!-- The Center (Average) -->
      
      <!-- Grid Crosshair -->
      <line :x1="size/2" y1="0" :x2="size/2" :y2="size" stroke="#ddd" />
      <line x1="0" :y1="size/2" :x2="size" :y2="size/2" stroke="#ddd" />

      <!-- Historical Points -->
      <circle 
        v-for="(p, i) in plotPoints" 
        :key="i"
        :cx="p.cx" 
        :cy="p.cy" 
        r="3" 
        :fill="i === plotPoints.length - 1 ? '#3b82f6' : '#94a3b8'"
        :fill-opacity="i === plotPoints.length - 1 ? 1 : 0.5"
      />
    </svg>
    <div class="text-xs text-center text-gray-500 mt-1">Relative Position (Auto-scaled)</div>
  </div>
</template>
