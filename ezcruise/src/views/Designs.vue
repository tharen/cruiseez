<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dbPut, dbGet, debounce, uid } from '../db.ts';
import type { Unit } from '../types/api.ts'

const props = defineProps(['navData'])
const emit = defineEmits(['update-title','nav'])
const save = debounce(() => { if (unit.value) dbPut("units", JSON.parse(JSON.stringify(unit.value))); }, 500);

const unit = ref<Unit>();

interface Method {
  code: string;
  description: string
}
const methods: Method[] = [
  {code:'VRP', description:'Variable radius plot'},
  {code:'RAD', description:'Fixed radius plot'},
  {code:'FIX', description:'Fixed area plot'},
  {code:'CEN', description:'100% census'},
  {code:'BRN', description:'Brown\'s transect'},
]

onMounted(async () => {
  emit('update-title', 'Sample Designs');
  unit.value = await dbGet('units', props.navData.uid) as Unit;
  if (!unit.value.designs) unit.value.designs = [];
});

const addDesign = (): void => {
  if (!unit.value) return;
  // verify codes are unique
  unit.value.designs.push({
    uid:uid(), code:"", method:"", size:1.0, min_dbh: 0.0, max_dbh: 999.9, description:"", form_point: 4.0
  }); 
  save(); 
};

const delDesign = (designId: string): void => {
  if (!unit.value) return;
  
  // Get the code for the design record
  const design = unit.value.designs.filter(d => d.uid===designId)[0];
  const code = design.code ?? '';

  // Check if design is in use
  const isDesignInUse = unit.value.plots.some(plot => 
    plot.trees.some(tree => tree.designCode === code)
  );

  // Warn user and bail
  if (isDesignInUse) {
    alert("Design is in use by one or more trees.");
    return;
  }

  // verify that no tree records are using the code
  if (confirm("Delete design? This cannot be undone!")) {
    unit.value.designs = unit.value.designs.filter(d => d.uid !== designId);
    save();
  }
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
            <select v-model="design.method" @change="save">
              <option v-for="m in methods" :key="m.code" :value="m.code">{{ m.code }}</option>
            </select>
            <label>Method</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="design.size" @input="save">
            <label>Size</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="design.min_dbh" type="number" @input="save">
            <label>Min DBH</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="design.max_dbh" type="number" @input="save">
            <label>Max DBH</label>
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
