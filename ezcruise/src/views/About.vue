<script setup lang="ts">
import {major_ver, minor_ver, patch_ver } from '../store';

</script>

<style scoped>
.about-view {
  background-color: white;
  padding: 8px;
}
</style>

<template>
  <div class="about-view">
    <h2>
      EZ Cruise - Timber
    </h2>
    <p>Version: {{ major_ver }}.{{ minor_ver }}.{{ patch_ver }}</p>
    <p>
      Created by Tod Haren tod.h.haren@odf.oregon.gov
    </p>
    <p>
      This is alpha software and may not be stable for production use.
    </p>
    <p>
      AI tools were used to support the development of this app.
    </p>
    <hr>
    <H2>Licenses</H2>
    <p><a href="https://vuejs.org/">Vue</a></p>
    <p><a href="https://vite.dev/">Vite</a></p>
    <p><a href="https://vite-pwa-org.netlify.app/">Vite-PWA</a></p>
    <p><a href="https://iconoir.com/">Iconoir</a></p>
    <p><a href="https://leafletjs.com/">Leaflet</a></p>
    <p><a href="https://geoman.io/">Geoman</a></p>
    <p><a href="https://turfjs.org/">Turf</a></p>
  </div>
</template>

