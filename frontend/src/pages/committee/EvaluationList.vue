<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4 font-weight-bold text-primary">
          <v-icon start>mdi-account-supervisor</v-icon>
          รายชื่อผู้รับการประเมิน
        </h1>
      </v-col>
    </v-row>

    <v-card class="mb-6 elevation-2">
      <v-card-text>
        <v-select
          v-model="selectedRoundId"
          :items="rounds"
          item-title="round_name"
          item-value="id"
          label="เลือกรอบการประเมิน"
          variant="outlined"
          prepend-inner-icon="mdi-calendar-range"
          hide-details
          @update:modelValue="fetchEvaluatees"
        ></v-select>
      </v-card-text>
    </v-card>

    <div v-if="loading" class="text-center py-5">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-3">กำลังโหลดข้อมูล...</div>
    </div>

    <v-card v-if="selectedRoundId && !loading" class="elevation-4">
      <v-card-title class="bg-primary">
        รายชื่อในรอบ " {{ selectedRoundName }} "
      </v-card-title>
      <v-table hover>
        <thead>
          <tr>
            <th class="text-left font-weight-bold">ID</th>
            <th class="text-left font-weight-bold">ชื่อ-นามสกุล</th>
            <th class="text-left font-weight-bold">บทบาทของฉัน</th>
            <th class="text-center font-weight-bold">สถานะการประเมิน</th>
            <th class="text-right font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in evaluatees" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.fullname }}</td>
            <td>
              <v-chip :color="user.committee_role === 'chairman' ? 'orange-darken-1' : 'blue-grey'" label size="small">
                {{ user.committee_role === 'chairman' ? 'ประธานกรรมการ' : 'กรรมการร่วม' }}
              </v-chip>
            </td>
            <td class="text-center">
              <v-chip 
                v-if="user.is_completed" 
                color="success" 
                variant="elevated"
                prepend-icon="mdi-check-all"
              >
                ประเมินครบแล้ว
              </v-chip>
              <v-chip 
                v-else-if="user.is_started" 
                color="warning" 
                variant="elevated"
                prepend-icon="mdi-progress-pencil"
              >
                กำลังดำเนินการ ({{ user.evaluated_count }}/{{ user.total_criteria }})
              </v-chip>
              <v-chip 
                v-else 
                color="grey" 
                variant="outlined"
              >
                ยังไม่เริ่ม
              </v-chip>
            </td>
            <td class="text-right">
              <v-btn
                :color="user.is_completed ? 'success' : 'primary'"
                :variant="user.is_completed ? 'tonal' : 'elevated'"
                :to="`/grading/${selectedRoundId}/${user.id}`"
                prepend-icon="mdi-pencil"
              >
                {{ user.is_completed ? 'แก้ไขคะแนน' : 'ให้คะแนน' }}
              </v-btn>
            </td>
          </tr>
          <tr v-if="evaluatees.length === 0">
            <td colspan="5" class="text-center text-grey py-5">
              ไม่พบรายชื่อที่ท่านต้องประเมินในรอบนี้
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import api from '../../plugins/axios';

const rounds = ref([]);
const selectedRoundId = ref(null);
const evaluatees = ref([]);
const loading = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success' });

onMounted(async () => {
  try {
    // ดึงรายการรอบการประเมิน
    const res = await api.get('/admin/rounds');
    rounds.value = res.data.data.filter(r => r.status === 'open');
    if (rounds.value.length > 0) {
      selectedRoundId.value = rounds.value[0].id;
      await fetchEvaluatees();
    }
  } catch (error) {
    console.error(error);
  }
});

const selectedRoundName = computed(() => {
  return rounds.value.find(r => r.id === selectedRoundId.value)?.round_name || '';
});

const fetchEvaluatees = async () => {
  if (!selectedRoundId.value) return;
  
  loading.value = true;
  try {
    // เรียก API ไปยัง Backend
    const res = await api.get(`/committee/rounds/${selectedRoundId.value}/evaluatees`);
    evaluatees.value = res.data.data;
  } catch (error) {
    console.error(error);
    snackbar.message = 'โหลดข้อมูลล้มเหลว';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};
</script>