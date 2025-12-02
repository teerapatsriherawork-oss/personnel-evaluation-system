<template>
  <v-container>
    <v-btn color="grey" variant="text" @click="$router.back()" class="mb-4" prepend-icon="mdi-arrow-left">ย้อนกลับ</v-btn>
    <div class="text-center mb-6">
      <h2>รายงานผลการประเมิน (Admin View)</h2>
      <p>ผู้รับการประเมิน: {{ userName }}</p>
    </div>

    <v-table class="border">
      <thead>
        <tr class="bg-grey-lighten-3">
          <th width="40%">หัวข้อ / ตัวชี้วัด</th>
          <th class="text-center">ตนเอง</th>
          <th class="text-center">กรรมการ (เฉลี่ย)</th>
          <th>ความเห็นกรรมการ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in reportData" :key="item.id">
          <td class="py-3">
            <div class="font-weight-bold">{{ item.topic_name }}</div>
            <div class="text-caption">{{ item.indicator_name }}</div>
          </td>
          <td class="text-center">{{ item.self_score || '-' }}</td>
          <td class="text-center font-weight-bold">{{ item.committee_score > 0 ? item.committee_score : '-' }}</td>
          <td class="text-caption text-grey">{{ item.committee_comment || '-' }}</td>
        </tr>
      </tbody>
    </v-table>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../plugins/axios';

const route = useRoute();
const reportData = ref([]);
const userName = ref('');

onMounted(async () => {
  try {
    const { roundId, userId } = route.params;
    const res = await api.get(`/admin/evaluations/${roundId}/${userId}`);
    reportData.value = res.data.data;
    userName.value = res.data.user_name;
  } catch (error) {
    console.error(error);
  }
});
</script>