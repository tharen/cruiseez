<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dbPut, dbGet, debounce, uid } from '../db.ts';

const props = defineProps(['navData'])
const emit = defineEmits(['update-title','nav'])
const save = debounce(() => { if (unit.value) dbPut("units", JSON.parse(JSON.stringify(unit.value))); }, 500);

const unit = ref(null);

onMounted(async () => {
  emit('update-title', 'Sample Designs');
  unit.value = await dbGet('units', props.navData.uid);
  if (!unit.value.designs) unit.value.designs = [];
});

const addDesign = () => { unit.value.designs.push({uid:uid(), code:"", method:"", size:"", description:""}); save(); };
const delDesign = (designId) => {
  if (confirm("Delete design?")) { unit.value.designs = unit.value.designs.filter(d => d.uid !== designId); save(); }
};
</script>

<template>
  <div>
    <div v-if="unit" class="grid">
      <div v-for="design in unit.designs" :key="design.uid" class="card">
        <div class="flex-row">
          <div class="floating-label">
            <input placeholder=" " v-model="design.code" @input="save">
            <label>Code</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="design.method" @input="save">
            <label>Sample Method</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="design.size" @input="save">
            <label>Sample Size</label>
          </div>
        </div>
        <div class="floating-label">
          <textarea placeholder=" " v-model="design.description" @input="save"></textarea>
          <label>Description</label>
        </div>
        <div class="actions">
          <button class="danger" @click="delDesign(design.uid)">Delete</button>
        </div>
      </div>
    </div>
    <button @click="addDesign">+ Add Design</button>
  </div>
</template>
