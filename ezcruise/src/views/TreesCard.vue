<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dbPut, dbGet, getSetup, debounce, uid } from '../db.ts';

const props = defineProps(['navData'])
const emit = defineEmits(['update-title','nav'])
const save = debounce(() => { if (unit.value) dbPut("units", JSON.parse(JSON.stringify(unit.value))); }, 500);

const unit = ref(null);
const plot = ref(null);

onMounted(async () => {
  emit('update-title', 'Trees');
  unit.value = await dbGet('units', props.navData.pid);
  plot.value = unit.value.plots.find(pl => pl.uid === props.navData.plotId);
});

const addTree = () => { plot.value.trees.push({ 
  uid:uid(), number:"", condition: "", designCode: "", 
  species:"", count:"", diameter:"", form_point: "", form_factor: "", 
  tdf: "", bole_height: "", total_height:"", crown_ratio: "", position: "", 
  damage_1: "", severity_1: "", damage_2: "", severity_2: "", segments:[] 
}); save(); }
const delTree = (treeId) => { if (confirm("Delete tree?")) { plot.value.trees = plot.value.trees.filter(t => t.uid !== treeId); save(); } }

</script>

<template>
<div v-if="unit && plot">
  <div v-for="tree in plot.trees" :key="tree.uid" class="card">
    <div class="flex-row">
      <select v-model="tree.designCode" @change="save" class="floating-label">
        <option value=""></option>
        <option v-for="d in (unit.designs || [])" :key="d.uid" :value="d.code">{{ d.code }}</option>
      </select>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.number" @input="save"></input>
        <label>Tree</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.condition" @input="save"></input>
        <label>Cond</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.species" @input="save"></input>
        <label>Species</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.count" @input="save"></input>
        <label>Count</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.diameter" @input="save"></input>
        <label>Diameter</label>
      </div>
    </div>
    <div class="flex-row">
      <div class="floating-label">
        <input placeholder=" " v-model="tree.form_point" @input="save"></input>
        <label>Form Point</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.form_factor" @input="save"></input>
        <label>Form Factor</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.tdf" @input="save">
        <label>TDF</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.bole_height" @input="save"></input>
        <label>Bole Ht</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.total_height" @input="save"></input>
        <label>Total Ht</label>
      </div>
    </div>
    <div class="flex-row">
      <div class="floating-label">
        <input placeholder=" " v-model="tree.crown_ratio" @input="save"></input>
        <label>Crown Ratio</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.position" @input="save"></input>
        <label>Position</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.damage_1" @input="save"></input>
        <label>Dmg-1</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.severity_1" @input="save"></input>
        <label>Sev-1</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.damage_2" @input="save"></input>
        <label>Dmg-2</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.severity_2" @input="save"></input>
        <label>Sev-2</label>
      </div>
    </div>
    <div class="flex-row">
      <div class="floating-label">
        <textarea placeholder=" " v-model="tree.notes" @input="save"></textarea>
        <label>Notes</label>
      </div>
    </div>
    <div class="flex-row">
      <div class="floating-label">
        <input placeholder=" " v-model="tree.total_cuft" @input="save" readonly></input>
        <label>Total CuFt</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.net_cuft" @input="save" readonly></input>
        <label>Net CuFt</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.net_bdft" @input="save" readonly></input>
        <label>Net BdFt</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.defect" @input="save" readonly></input>
        <label>% Defect</label>
      </div>
    </div>

    <div class="actions">
      <button @click="$emit('nav', {view:'segments', pid:unit.uid, plotId:plot.uid, treeId:tree.uid})">Segments</button>
      <button class="danger push-right" @click="delTree(tree.uid)">Delete</button>
    </div>
  </div>
  <button @click="addTree">+ Add Tree</button>
  <button @click="$emit('nav', {view:'trees', pid:unit.uid, plotId:plot.uid})">Table</button>
</div>
</template>
