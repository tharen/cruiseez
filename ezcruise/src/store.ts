// Constants and state variables
// Could use Pinia for global state

import { ref } from 'vue';
import pkg from '../package.json';
import type { Species } from './types/api';

export const major_ver = pkg.version.split('.')[0];
export const minor_ver = pkg.version.split('.')[1];
export const patch_ver = pkg.version.split('.')[2];

// Species list used for sorting select inputs
export const speciesList = ref<Species[]>([]);
