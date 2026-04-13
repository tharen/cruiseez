<!--
  TODO: Implement Condition options
  TODO: Implement Species options prop
  TODO: Position options
  TODO: Validation rules, CR<=100, unreasonable ht(dbh)
 -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dbPut, dbGet, debounce, uid } from '../db.ts';
import type { Unit, Plot } from '../types/api.ts';

import { Table, ViewColumns2 } from '@iconoir/vue';

const defaultFormPoint = 4.0;

const props = defineProps(['navData'])
const emit = defineEmits(['update-title','nav'])
const unit = ref<Unit>();
const plot = ref<Plot>();
const treeLayout = ref<String>(localStorage.getItem('tree_layout') ?? "Card");

const save = debounce((): void => {
  if (unit.value) dbPut("units", JSON.parse(JSON.stringify(unit.value)));
}, 500);

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
  
  let nextNum = Math.max(...currentPlot.trees.map(tree => tree.number)) + 1;
  nextNum = Number.isFinite(nextNum) ? nextNum : 1;
  const lastTree = currentPlot.trees[currentPlot.trees.length-1];

  currentPlot.trees.push({ 
    uid:uid(),
    number:nextNum,
    condition: lastTree?.condition ?? "",
    designCode: lastTree?.designCode ?? "", 
    species:lastTree?.species ?? "",
    count:1,
    diameter:-1.0,
    form_point: lastTree?.form_point ?? defaultFormPoint,
    form_factor: -1, 
    tdf: lastTree?.tdf ?? "",
    bole_height: -1, total_height: -1, crown_ratio: -1, position: "",
    damage_1: "", severity_1: 0.0, damage_2: "", severity_2: 0.0, segments:[],
    notes: "", total_cuft: 0.0, gross_cuft: 0.0, net_cuft: 0.0, gross_bdft: 0.0, net_bdft: 0.0,
    defect: 0.0
  });
  save();
}

const delTree = (treeId: string): void => {
  const currentPlot = plot.value;
  if (!currentPlot) return;
  if (confirm("Delete tree?")) {
    currentPlot.trees = currentPlot.trees.filter(t => t.uid !== treeId);
    save();
  }
}

const toggleLayout = (): void => {
  treeLayout.value = treeLayout.value==='Card' ? 'Table' : 'Card'
}


</script>

<style scoped>
.icon-button {
  margin-right: 4px;
}
.icon-rotate {
  transform: rotate(90deg);
}
</style>

<template>
<div v-if="unit && plot">
  <div v-if="treeLayout=='Table'">
  <div style="overflow-x: auto;">
    <table>
      <thead>
        <tr>
          <th>SD</th><th>#</th><th>Cond</th><th>Spp</th><th>Cnt</th><th>DBH</th>
          <th>FP</th><th>FF</th><th>TDF</th><th>Bole Ht</th><th>Tot Ht</th>
          <th>CR</th><th>CP</th><th>Dmg-1</th><th>Sev-1</th><th>Dmg-2</th><th>Sev-2</th>
          <th>Notes</th><th>Segs</th><th>❌</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tree in plot.trees" :key="tree.uid">
          <td>
            <select v-model="tree.designCode" @change="save" class="cell-input">
              <option value=""></option>
              <option v-for="d in (unit.designs || [])" :key="d.uid" :value="d.code">{{ d.code }}</option>
            </select>
          </td>
          <td><input v-model="tree.number" @input="save" class="cell-input"></td>
          <td><input v-model="tree.condition" @input="save" class="cell-input" onfocus="this.select()"></td>
          <!-- <td><input v-model="tree.species" @input="save" class="cell-input" onfocus="this.select()"></td> -->
          <td>
            <select v-model="tree.species" @change="save" class="cell-input">
              <option value=""></option>
              <option v-for="s in (unit.species || [])" :key="s.code" :value="s.name">{{ s.code }}</option>
            </select>
          </td>
          <td><input v-model="tree.count" @input="save" class="cell-input" type="number" onfocus="this.select()"></td>
          <td><input v-model="tree.diameter" @input="save" class="cell-input" type="number" onfocus="this.select()"></td>
          <td><input v-model="tree.form_point" @input="save" class="cell-input" type="number" onfocus="this.select()"></td>
          <td><input v-model="tree.form_factor" @input="save" class="cell-input" type="number" onfocus="this.select()"></td>
          <td><input v-model="tree.tdf" @input="save" class="cell-input" onfocus="this.select()"></td>
          <td><input v-model="tree.bole_height" @input="save" class="cell-input" type="number" onfocus="this.select()"></td>
          <td><input v-model="tree.total_height" @input="save" class="cell-input" type="number" onfocus="this.select()"></td>
          <td><input v-model="tree.crown_ratio" @input="save" class="cell-input" type="number" onfocus="this.select()"></td>
          <td><input v-model="tree.position" @input="save" class="cell-input"></td>
          <td><input v-model="tree.damage_1" @input="save" class="cell-input" onfocus="this.select()"></td>
          <td><input v-model="tree.severity_1" @input="save" class="cell-input" type="number" onfocus="this.select()"></td>
          <td><input v-model="tree.damage_2" @input="save" class="cell-input" onfocus="this.select()"></td>
          <td><input v-model="tree.severity_2" @input="save" class="cell-input" type="number" onfocus="this.select()"></td>
          <td><input v-model="tree.notes" @input="save" class="cell-input"></td>
          <td><button class="table-button" @click="$emit('nav', {view:'segments', pid:unit.uid, plotId:plot.uid, treeId:tree.uid})">✎</button></td>
          <td><button class="table-button" @click="delTree(tree.uid)">❌</button></td>
        </tr>
      </tbody>
    </table>
  </div>
  </div>
  <div v-else>
    <div v-for="tree in plot.trees" :key="tree.uid" class="card">
        <div class="flex-row"  style="width: fit-content">
          <div class="floating-label">
            <select v-model="tree.designCode" @change="save">
              <option value=""></option>
              <option v-for="d in (unit.designs || [])" :key="d.uid" :value="d.code">{{ d.code }}</option>
            </select>
            <label>SD</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="tree.number" @input="save" type="number"></input>
            <label>Tree</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="tree.condition" @input="save" onfocus="this.select()"></input>
            <label>Cond</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="tree.species" @input="save" onfocus="this.select()"></input>
            <label>Spp</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="tree.count" @input="save" type="number" onfocus="this.select()"></input>
            <label>Count</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="tree.diameter" @input="save" type="number" onfocus="this.select()"></input>
            <label>DBH</label>
          </div>
        </div>
        <div class="flex-row">
          <div class="floating-label">
            <input placeholder=" " v-model="tree.form_point" @input="save" type="number" onfocus="this.select()"></input>
            <label>FP</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="tree.form_factor" @input="save" type="number" onfocus="this.select()"></input>
            <label>FF</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="tree.tdf" @input="save">
            <label>TDF</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="tree.bole_height" @input="save" type="number" onfocus="this.select()"></input>
            <label>Bole Ht</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="tree.total_height" @input="save" type="number" onfocus="this.select()"></input>
            <label>Tot Ht</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="tree.crown_ratio" @input="save" type="number" onfocus="this.select()"></input>
            <label>CR (%)</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="tree.position" @input="save" onfocus="this.select()"></input>
            <label>CP</label>
          </div>
        </div>
        <div class="flex-row">
          <div class="floating-label">
            <input placeholder=" " v-model="tree.damage_1" @input="save" onfocus="this.select()"></input>
            <label>Dmg-1</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="tree.severity_1" @input="save" type="number" onfocus="this.select()"></input>
            <label>Sev-1</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="tree.damage_2" @input="save" onfocus="this.select()"></input>
            <label>Dmg-2</label>
          </div>
          <div class="floating-label">
            <input placeholder=" " v-model="tree.severity_2" @input="save" type="number" onfocus="this.select()"></input>
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
  </div>
  <div class="actions">
    <button @click="addTree">+ Add Tree</button>
    <!-- <button @click="$emit('nav', {view:'trees-card', pid:unit.uid, plotId:plot.uid})">Cards</button> -->
  </div>
  <Teleport to="#teleport-menu">
    <a href="#" @click="toggleLayout">
      <span v-if="treeLayout=='Card'"><Table height="20" width="20" class="icon-button" /> Table View</span>
      <span v-if="treeLayout=='Table'"><ViewColumns2 height="20" width="20" class="icon-button icon-rotate" /> Card View</span>
    </a>
  </Teleport>
</div>
</template>
