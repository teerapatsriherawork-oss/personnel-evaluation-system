<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4 font-weight-bold text-primary">
          <v-icon start>mdi-clipboard-list</v-icon>
          สรุปผลการประเมินรายกรรมการ
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
          prepend-inner-icon="mdi-calendar-check"
          hide-details
          @update:modelValue="fetchSummary"
        ></v-select>
      </v-card-text>
    </v-card>

    <v-card class="elevation-4" v-if="selectedRoundId">
      <v-card-title class="d-flex align-center bg-grey-lighten-4">
        <span>รายการจับคู่และการประเมิน</span>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="ค้นหาชื่อผู้รับ/ผู้ประเมิน..."
          single-line
          hide-details
          density="compact"
          variant="outlined"
          style="max-width: 300px;"
        ></v-text-field>
      </v-card-title>

      <v-table hover>
        <thead>
          <tr>
            <th class="text-left font-weight-bold">ผู้รับการประเมิน (Evaluatee)</th>
            <th class="text-left font-weight-bold">กรรมการผู้ประเมิน (Evaluator)</th>
            <th class="text-center font-weight-bold">ตำแหน่ง</th>
            <th class="text-center font-weight-bold">สถานะ (ข้อที่ประเมิน)</th>
            <th class="text-center font-weight-bold">คะแนนรวม</th>
            <th class="text-center font-weight-bold">ผลการดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredList" :key="item.mapping_id">
            <td class="font-weight-medium">{{ item.evaluatee_name }}</td>
            <td class="text-grey-darken-2">{{ item.evaluator_name }}</td>
            <td class="text-center">
              <v-chip size="small" :color="item.committee_role === 'chairman' ? 'orange' : 'blue-grey'" label>
                {{ item.committee_role === 'chairman' ? 'ประธาน' : 'กรรมการ' }}
              </v-chip>
            </td>
            <td class="text-center">
              {{ item.evaluated_count }} / {{ item.total_criteria }}
            </td>
            <td class="text-center font-weight-bold text-primary text-h6">
              {{ item.total_score }}
            </td>
            <td class="text-center">
              <v-chip 
                :color="item.is_complete ? 'success' : 'warning'"
                variant="elevated"
                size="small"
              >
                <v-icon start size="x-small">
                  {{ item.is_complete ? 'mdi-check-circle' : 'mdi-clock-outline' }}
                </v-icon>
                {{ item.is_complete ? 'Completed' : 'Pending' }}
              </v-chip>
            </td>
          </tr>
          <tr v-if="filteredList.length === 0">
            <td colspan="6" class="text-center text-grey py-6">
              ไม่พบข้อมูล หรือยังไม่มีการจับคู่กรรมการในรอบนี้
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <div v-else class="text-center py-10 text-grey">
      กรุณาเลือกรอบการประเมินเพื่อดูข้อมูล
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../../plugins/axios';

const rounds = ref([]);
const selectedRoundId = ref(null);
const summaryData = ref([]);
const search = ref('');

onMounted(async () => {
  try {
    const res = await api.get('/admin/rounds');
    rounds.value = res.data.data;
  } catch (error) {
    console.error('Error fetching rounds:', error);
  }
});

const fetchSummary = async () => {
  if (!selectedRoundId.value) return;
  try {
    // [CORRECTED] แก้ไขชื่อตัวแปรให้ถูกต้อง
    const res = await api.get(`/admin/summary/${selectedRoundId.value}`);
    summaryData.value = res.data.data;
  } catch (error) {
    console.error('Error fetching summary:', error);
    summaryData.value = [];
  }
};

const filteredList = computed(() => {
  if (!search.value) return summaryData.value;
  const q = search.value.toLowerCase();
  return summaryData.value.filter(item => 
    item.evaluatee_name.toLowerCase().includes(q) ||
    item.evaluator_name.toLowerCase().includes(q)
  );
});
</script>