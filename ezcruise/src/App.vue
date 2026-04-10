<script setup lang="ts">
import { ref,computed,onMounted } from 'vue'
import { openDB } from './db.ts';
import Setup from './views/Setup.vue'
import UnitsView from './views/UnitsView.vue'
import Unit from './views/Unit.vue'
import Designs from './views/Designs.vue'
import Plots from './views/Plots.vue'
import Trees from './views/Trees.vue'
import TreesCard from './views/TreesCard.vue'
import Segments from './views/Segments.vue'

const nav = ref({ view: "units", prev: null });
const title = ref("Units");
const dbReady = ref(false);

onMounted(async () => {
    await openDB();
    dbReady.value = true;
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
    }
});

const currentComponent = computed(() => {
    switch (nav.value.view) {
        case 'units': return UnitsView;
        case 'unit': return Unit;
        case 'plots': return Plots;
        case 'designs': return Designs;
        case 'trees': return Trees;
        case 'trees-card': return TreesCard;
        case 'segments': return Segments;
        case 'setup': return Setup;
    }
});

const navigate = (newNav) => {
    nav.value = { ...newNav, prev: nav.value };
};

const goBack = () => {
    if (nav.value.prev) nav.value = nav.value.prev;
};

const openSetup = () => {
    navigate({ view: 'setup' });
};
</script>

<template>
  <div class="app-container">
    <header class="header">
        <button v-show="nav.view !== 'units'" @click="goBack">◀ Back</button>
        <button v-show="nav.view == 'units'">Home</button>
        <strong>{{ title }}</strong>
        <div class="dropdown">
            <button class="dropdown-button">☰</button>
            <div class="dropdown-content">
                <a href="#" v-show="nav.view !== 'setup'" @click="openSetup">Setup</a>
                <a href="#" @click="openAbout">About</a>
            </div>
        </div>
    </header>

    <main>
      <component v-if="dbReady" :is="currentComponent" :nav-data="nav" @nav="navigate" @update-title="title = $event"></component>
    </main>
  
  </div>
</template>
