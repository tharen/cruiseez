<script setup lang="ts">
import { ref,computed,onMounted } from 'vue'
import { openDB } from './db';
import Setup from './views/Setup.vue'
import About from './views/About.vue'
import UnitsView from './views/UnitsView.vue'
import Unit from './views/Unit.vue'
import Designs from './views/Designs.vue'
import Plots from './views/Plots.vue'
import Trees from './views/Trees.vue'
import Segments from './views/Segments.vue'

interface NavigationState {
  view: string;
  // 'prev' can be another NavigationState or null
  prev: NavigationState | null;
}

const nav = ref<NavigationState>({
    view: "units",
    prev: null 
});
const title = ref("Units");
const dbReady = ref(false);
// const isMenuOpen = ref(false);
// const menuRef = ref(null);

// const handleClickOutside = (event:Event) => {
//   // If the click was NOT on the menu or its children, close it
//   if (menuRef.value && !menuRef.value.contains(event.target)) {
//     isMenuOpen.value = false;
//   }
// };

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
        case 'segments': return Segments;
        case 'setup': return Setup;
        case 'about': return About;
    }
});

const navigate = (newNav: Pick<NavigationState, 'view'>) => {
    nav.value = { ...newNav, prev: nav.value };
};

const goBack = () => {
    if (nav.value.prev) nav.value = nav.value.prev;
};

const openSetup = () => {
    navigate({ view: 'setup' });
};

const openAbout = () => {
    navigate({ view: 'about' });
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
                <div id="teleport-menu"></div>
                <a href="#" v-show="nav.view !== 'setup'" @click="openSetup">Setup</a>
                <a href="#" v-show="nav.view !== 'about'" @click="openAbout">About</a>
            </div>
        </div>
    </header>

    <main>
      <component v-if="dbReady" :is="currentComponent" :nav-data="nav" @nav="navigate" @update-title="title = $event"></component>
    </main>
  
  </div>
</template>
