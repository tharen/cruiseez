<!--
  TODO: Implement Condition options
  TODO: Implement Species options prop
  TODO: Position options
  TODO: Validation rules, CR<=100, unreasonable ht(dbh)
  TODO: Get defaultFormPoint from the sample design for the tree
 -->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { dbPut, dbGet, debounce, uid } from '../db.ts';
import type { Unit, Plot } from '../types/api.ts';

const defaultFormPoint = 4.0;

const props = defineProps(['navData'])
const emit = defineEmits(['update-title','nav'])
const unit = ref<Unit>();
const plot = ref<Plot>();
// const speciesOpts = inject('speciesOpts')
// console.log(speciesOpts.value)
// const
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
  const nextTree = 0;
  currentPlot.trees.push({ 
    uid:uid(), number:nextTree, condition: "", designCode: "", 
    species:"", count:1, diameter:-1.0, form_point: defaultFormPoint, form_factor: -1, 
    tdf: "", bole_height: -1, total_height: -1, crown_ratio: -1, position: "",
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
</script>

<template>
<div v-if="unit && plot">
  <div style="overflow-x: auto;">
    <table>
      <thead>
        <tr>
          <th>SD</th><th>#</th><th>Cond</th><th>Species</th><th>Cnt</th><th>Diam</th>
          <th>FP</th><th>FF</th><th>TDF</th><th>Bole Ht</th><th>Tot Ht</th>
          <th>CR</th><th>Pos</th><th>Dmg-1</th><th>Sev-1</th><th>Dmg-2</th><th>Sev-2</th>
          <th>Logs</th><th>❌</th>
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
          <td><input v-model="tree.condition" @input="save" class="cell-input"></td>
          <td><input v-model="tree.species" @input="save" class="cell-input"></td>
          <td><input v-model="tree.count" @input="save" class="cell-input"></td>
          <td><input v-model="tree.diameter" @input="save" class="cell-input"></td>
          <td><input v-model="tree.form_point" @input="save" class="cell-input"></td>
          <td><input v-model="tree.form_factor" @input="save" class="cell-input"></td>
          <td><input v-model="tree.tdf" @input="save" class="cell-input"></td>
          <td><input v-model="tree.bole_height" @input="save" class="cell-input"></td>
          <td><input v-model="tree.total_height" @input="save" class="cell-input"></td>
          <td><input v-model="tree.crown_ratio" @input="save" class="cell-input"></td>
          <td><input v-model="tree.position" @input="save" class="cell-input"></td>
          <td><input v-model="tree.damage_1" @input="save" class="cell-input"></td>
          <td><input v-model="tree.severity_1" @input="save" class="cell-input"></td>
          <td><input v-model="tree.damage_2" @input="save" class="cell-input"></td>
          <td><input v-model="tree.severity_2" @input="save" class="cell-input"></td>
          <td><input v-model="tree.notes" @input="save" class="cell-input"></td>
          <td><button class="table-button" @click="$emit('nav', {view:'segments', pid:unit.uid, plotId:plot.uid, treeId:tree.uid})">✎</button></td>
          <td><button class="table-button" @click="delTree(tree.uid)">❌</button></td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="actions">
    <button @click="addTree">+ Add Tree</button>
    <button @click="$emit('nav', {view:'trees-card', pid:unit.uid, plotId:plot.uid})">Cards</button>
  </div>
</div>
</template>
