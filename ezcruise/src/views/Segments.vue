// TODO: Implement grade and defect type options
// TODO: Auto increment position
// TODO: Default log length = bole height - cum(len+trim)

<script setup lang="ts">

import { ref, onMounted } from 'vue'
import { dbGet, dbPut, debounce, uid } from '../db';
import type {Unit, Tree } from '../types/api';
import { Xmark } from '@iconoir/vue';

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
  let nextPos = Math.max(...currentTree.segments.map(seg => seg.position)) + 1;
  nextPos = Number.isFinite(nextPos) ? nextPos : 1;
  const lastLog = currentTree.segments[currentTree.segments.length-1];
  currentTree.segments.push({
  uid:uid(),position:nextPos,
  length: null,
  sort:lastLog?.sort ?? null,
  grade: null,
  def_type: null,
  def_amt: null,
  bole_height: null,
  small_diam:null,
  large_diam:null,
  gross_cuft:null,
  gross_bdft:null,
  net_cuft:null,
  net_bdft:null
}); save(); };

const delLog = (logId: string) => {
  const currentTree = tree.value;
  if (!currentTree) return;
  if (confirm("Delete log?")) { 
    currentTree.segments = currentTree.segments.filter(l => l.uid !== logId);
    save();
  }
};

// const taperDiam:Number = (targ_ht:number, base_ht:number, diam_base:number, diam_bole:number, bole_len:number) => {
//   const taper = (diam_bole-diam_base)/bole_len;

//   const targ_len = targ_ht-base_ht;
//   const targ_diam = diam_base - targ_len*taper; 

//   return targ_diam;
// }

// const computeLogs = () => {
//   const curTree = tree.value;
//   if (!curTree) return;
//   if (!unit.value) return;
//   const dbh = curTree.diameter;
//   if (!dbh) return;
//   const ff = curTree.form_factor ?? 85;
//   const fp = curTree.form_point ?? 4;
//   const td = curTree.tdf ?? 6;
//   const bht = curTree.bole_height;
//   if (!bht) return;
//   const spp = unit.value.species.find(sp => sp.code === curTree.species);
//   if (!spp) return;
//   const bf = (spp.bark_factor ?? 0.9);
//   const sh = 0.5; // TODO: Stump ht should come from the species table
//   const trim = 1.0;

//   const dib_base = dbh * ff * bf; // diameter inside bark of first 16' log

//   const large_dib = ff/(16-fp);
//   const small_dib = taperDiam(
//     curTree.segments[0].length + trim
//   );

// }

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
            <th>#</th>
            <th>Len</th>
            <th>Srt</th>
            <th>Grd</th>
            <th>Type</th>
            <th>Amt</th>
            <th>Len</th>
            <th>Small</th>
            <th>Large</th>
            <th>Grs</th>
            <th>Net</th>
            <th>Grs</th>
            <th>Net</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="segment in tree.segments" :key="segment.uid">
            <td><input v-model="segment.position" @input="save" class="cell-input center" type="number"></td>
            <td><input v-model="segment.length" @input="save" class="cell-input" type="number" onfocus="this.select()"></td>
            <td><input v-model="segment.sort" @input="save" class="cell-input" onfocus="this.select()"></td>
            <td><input v-model="segment.grade" @input="save" class="cell-input" onfocus="this.select()"></td>
            <td><input v-model="segment.def_type" @input="save" class="cell-input" onfocus="this.select()"></td>
            <td><input v-model="segment.def_amt" @input="save" class="cell-input" type="number" onfocus="this.select()"></td>
            <td><input v-model="segment.bole_height" class="cell-input" readonly></td>
            <td><input v-model="segment.small_diam" class="cell-input" readonly></td>
            <td><input v-model="segment.large_diam" class="cell-input" readonly></td>
            <td><input v-model="segment.gross_cuft" class="cell-input" readonly></td>
            <td><input v-model="segment.net_cuft" class="cell-input" readonly></td>
            <td><input v-model="segment.gross_bdft" class="cell-input" readonly></td>
            <td><input v-model="segment.net_bdft" class="cell-input" readonly></td>
            <!-- <td><button class="table-button" @click="delLog(segment.uid)">❌</button></td> -->
            <td><button class="table-button danger" @click="delLog(segment.uid)"><Xmark /></button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <button @click="addLog" style="margin-top: 10px;">+ Add Segment</button>
  </div>
</template>
