// TODO: Implement grade and defect type options
// TODO: Auto increment position
// TODO: Default log length = bole height - cum(len+trim)

<script setup lang="ts">

import { ref, onMounted } from 'vue'
import { dbGet, dbPut, debounce, uid } from '../db.ts';
import type {Unit, Tree } from '../types/api.ts';

const props = defineProps(['navData'])
const emit = defineEmits(['update-title','nav'])

const unit = ref<Unit>();
const tree = ref<Tree>();
const save = debounce(() => { if (unit.value) dbPut("units", JSON.parse(JSON.stringify(unit.value))); }, 500);

onMounted(async () => {
    emit('update-title', 'Segments');
    const data = await dbGet('units', props.navData.pid);
    unit.value = data as Unit;
    const currentUnit = unit.value;
    if (!currentUnit) return;
    if (!props) return;
    const plot = currentUnit.plots.find(pl => pl.uid === props.navData.plotId);
    if (!plot) return;
    tree.value = plot.trees.find(t => t.uid === props.navData.treeId);
});

const addLog = (): void => { 
  const currentTree = tree.value;
  if (!currentTree) return;
  currentTree.segments.push({
  uid:uid(),position:0,length:0.0,sort:"",grade:"",
  def_type:"",def_amt:0,bole_height:0.0,
  small_diam:0.0,large_diam:0.0,
  gross_cuft:0.0,gross_bdft:0.0,
  net_cuft:0.0,net_bdft:0.0
}); save(); };

const delLog = (logId: string) => {
  const currentTree = tree.value;
  if (!currentTree) return;
  if (confirm("Delete log?")) { 
    currentTree.segments = currentTree.segments.filter(l => l.uid !== logId);
    save();
  }
};

</script>

<template>
  <div v-if="unit && tree">
    <div style="overflow-x: auto;">
      <table>
        <thead>
          <tr>
            <th colspan="4"></th>
            <th colspan="2">Defect</th>
            <th colspan="1">Bole</th>
            <th colspan="2">Diam</th>
            <th colspan="2">CuFt</th>
            <th colspan="2">BdFt</th>
            <th colspan="1"></th>
          </tr>
          <tr>
            <th>Pos</th>
            <th>Len</th>
            <th>Sort</th>
            <th>Grade</th>
            <th>Type</th>
            <th>Amt</th>
            <th>Ht</th>
            <th>Small</th>
            <th>Large</th>
            <th>Gross</th>
            <th>Net</th>
            <th>Gross</th>
            <th>Net</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="segment in tree.segments" :key="segment.uid">
            <td><input v-model="segment.position" @input="save" class="cell-input"></td>
            <td><input v-model="segment.length" @input="save" class="cell-input"></td>
            <td><input v-model="segment.sort" @input="save" class="cell-input"></td>
            <td><input v-model="segment.grade" @input="save" class="cell-input"></td>
            <td><input v-model="segment.def_type" @input="save" class="cell-input"></td>
            <td><input v-model="segment.def_amt" @input="save" class="cell-input"></td>
            <td><input v-model="segment.bole_height" @input="save" class="cell-input" readonly></td>
            <td><input v-model="segment.small_diam" @input="save" class="cell-input" readonly></td>
            <td><input v-model="segment.large_diam" @input="save" class="cell-input" readonly></td>
            <td><input v-model="segment.gross_cuft" @input="save" class="cell-input" readonly></td>
            <td><input v-model="segment.net_cuft" @input="save" class="cell-input" readonly></td>
            <td><input v-model="segment.gross_bdft" @input="save" class="cell-input" readonly></td>
            <td><input v-model="segment.net_bdft" @input="save" class="cell-input" readonly></td>
            <td><button class="table-button" @click="delLog(segment.uid)">❌</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <button @click="addLog" style="margin-top: 10px;">+ Add Segment</button>
  </div>
</template>
