<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dbPut, dbGet, debounce, uid } from '../db.ts';
import type { Unit, Plot} from '../types/api.ts';

const defaultFormPoint = 4.0;
const props = defineProps(['navData'])
const emit = defineEmits(['update-title','nav'])
const save = debounce(() => { if (unit.value) dbPut("units", JSON.parse(JSON.stringify(unit.value))); }, 500);

const unit = ref<Unit>();
const plot = ref<Plot>();

onMounted(async () => {
  emit('update-title', 'Trees');
  const data = await dbGet('units', props.navData.pid);
  unit.value = data as Unit;
  const currentUnit = unit.value;
  if (!currentUnit) return;
  plot.value = currentUnit.plots.find(pl => pl.uid === props.navData.plotId);
});

const addTree = (): void => {
  const currentPlot = plot.value;
  if (!currentPlot) return;
  const nextNum = Math.max(...currentPlot.trees.map(tree => tree.number)) + 1;
  const lastTree = currentPlot.trees[currentPlot.trees.length-1];
  currentPlot.trees.push({ 
    uid:uid(), number:nextNum ?? 1, condition: lastTree.condition ?? "", designCode: lastTree.designCode ?? "", 
    species:lastTree.species ?? "", count:1, diameter:-1.0, form_point: lastTree.form_point ?? defaultFormPoint, form_factor: -1, 
    tdf: lastTree.tdf ?? "", bole_height: -1, total_height: -1, crown_ratio: -1, position: "",
    damage_1: "", severity_1: 0.0, damage_2: "", severity_2: 0.0, segments:[],
    notes: "", total_cuft: 0.0, gross_cuft: 0.0, net_cuft: 0.0, gross_bdft: 0.0, net_bdft: 0.0,
    defect: 0.0
  });
  save();
}

const delTree = (treeId: string) => {
  const currentPlot = plot.value;
  if (!currentPlot) return
  if (confirm("Delete tree?")) {
    currentPlot.trees = currentPlot.trees.filter(t => t.uid !== treeId);
    save();
  }
}

</script>

<template>
<div v-if="unit && plot">
  <div v-for="tree in plot.trees" :key="tree.uid" class="card">
    <div class="flex-row"  style="width: fit-content">
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
      <div class="floating-label">
        <input placeholder=" " v-model="tree.crown_ratio" @input="save"></input>
        <label>Crown %</label>
      </div>
      <div class="floating-label">
        <input placeholder=" " v-model="tree.position" @input="save"></input>
        <label>Position</label>
      </div>
    </div>
    <div class="flex-row">
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
        <input placeholder=" " v-model="tree.notes" @input="save"></input>
        <label>Notes</label>
      </div>
    </div>
    <div class="flex-row" style="width: fit-content">
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
