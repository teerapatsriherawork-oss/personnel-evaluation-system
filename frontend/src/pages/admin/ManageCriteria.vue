<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4 font-weight-bold text-primary">
          <v-icon start>mdi-format-list-checks</v-icon>
          จัดการเกณฑ์การประเมิน
        </h1>
      </v-col>
    </v-row>

    <v-card class="mb-4 elevation-2">
      <v-card-text>
        <v-select
          v-model="selectedRoundId"
          :items="rounds"
          item-title="round_name"
          item-value="id"
          label="เลือกรอบการประเมินที่ต้องการจัดการ"
          variant="outlined"
          hide-details
        ></v-select>
      </v-card-text>
    </v-card>

    <div v-if="selectedRoundId">
      <v-row>
        <v-col cols="12" md="4">
          <v-card class="elevation-2 h-100">
            <v-card-title class="bg-secondary text-white">
              1. จัดการหัวข้อ (Topics)
            </v-card-title>
            <v-card-text class="pt-4">
              <v-form @submit.prevent="createTopic">
                <v-text-field
                  v-model="topicForm.topic_name"
                  label="ชื่อหัวข้อหลัก"
                  placeholder="เช่น สมรรถนะหลัก, KPI"
                  variant="outlined"
                  density="compact"
                  append-inner-icon="mdi-plus-circle"
                  @click:append-inner="createTopic"
                  :loading="topicLoading"
                ></v-text-field>
              </v-form>

              <v-list density="compact" class="mt-2 border rounded">
                <v-list-subheader>รายชื่อหัวข้อที่มีอยู่</v-list-subheader>
                <v-list-item v-for="t in topics" :key="t.id" :title="t.topic_name">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-label" color="secondary"></v-icon>
                  </template>
                </v-list-item>
                <v-list-item v-if="topics.length === 0">
                  <div class="text-caption text-grey text-center">ยังไม่มีหัวข้อ</div>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="8">
          <v-card class="elevation-4">
            <v-card-title class="bg-primary text-white">
              2. เพิ่มตัวชี้วัด (Indicators)
            </v-card-title>
            <v-card-text class="pt-4">
              <v-form @submit.prevent="createCriteria" ref="criForm">
                <v-select
                  v-model="criteriaForm.topic_id"
                  :items="topics"
                  item-title="topic_name"
                  item-value="id"
                  label="เลือกหัวข้อ (Topic)"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'กรุณาเลือกหัวข้อ']"
                ></v-select>

                <v-textarea
                  v-model="criteriaForm.indicator_name"
                  label="ตัวชี้วัด (Indicator)"
                  placeholder="รายละเอียดสิ่งที่ต้องการวัด..."
                  variant="outlined"
                  rows="2"
                  required
                ></v-textarea>

                <v-row>
                  <v-col cols="6">
                    <v-text-field
                      v-model="criteriaForm.max_score"
                      label="คะแนนเต็ม"
                      type="number"
                      variant="outlined"
                      required
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <v-select
                      v-model="criteriaForm.scoring_type"
                      label="รูปแบบคะแนน"
                      :items="[{title:'Scale 1-4', value:'scale'}, {title:'Boolean (มี/ไม่มี)', value:'boolean'}]"
                      variant="outlined"
                    ></v-select>
                  </v-col>
                </v-row>

                <v-btn type="submit" color="success" block :loading="criLoading">
                  บันทึกตัวชี้วัด
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>

          <v-card class="mt-4 elevation-2">
            <v-card-title>รายการเกณฑ์ทั้งหมดในรอบนี้</v-card-title>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>หัวข้อ</th>
                  <th>ตัวชี้วัด</th>
                  <th>คะแนน</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in criteriaList" :key="item.id">
                  <td class="font-weight-bold text-secondary">{{ item.topic_name }}</td>
                  <td>{{ item.indicator_name }}</td>
                  <td>{{ item.max_score }}</td>
                </tr>
                <tr v-if="criteriaList.length === 0">
                  <td colspan="3" class="text-center text-grey">ยังไม่มีข้อมูล</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import api from '../../plugins/axios';

const rounds = ref([]);
const selectedRoundId = ref(null);
const topics = ref([]);
const criteriaList = ref([]);

const topicLoading = ref(false);
const criLoading = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success' });

const topicForm = reactive({ topic_name: '' });
const criteriaForm = reactive({
  topic_id: null,
  indicator_name: '',
  max_score: 10,
  scoring_type: 'scale'
});

onMounted(async () => {
  try {
    const res = await api.get('/admin/rounds');
    rounds.value = res.data.data;
  } catch (error) { console.error(error); }
});

// เมื่อเลือกรอบ -> โหลด Topic และ Criteria
watch(selectedRoundId, async (newId) => {
  if (newId) {
    await fetchTopics(newId);
    await fetchCriterias(newId);
  }
});

const fetchTopics = async (roundId) => {
  try {
    const res = await api.get(`/admin/rounds/${roundId}/topics`);
    topics.value = res.data.data;
  } catch (error) { console.error(error); }
};

const fetchCriterias = async (roundId) => {
  try {
    const res = await api.get(`/admin/rounds/${roundId}/criterias`);
    criteriaList.value = res.data.data;
  } catch (error) { console.error(error); }
};

// สร้าง Topic
const createTopic = async () => {
  if (!topicForm.topic_name) return;
  topicLoading.value = true;
  try {
    await api.post('/admin/topics', {
      round_id: selectedRoundId.value,
      topic_name: topicForm.topic_name
    });
    snackbar.message = 'เพิ่มหัวข้อสำเร็จ';
    snackbar.show = true;
    topicForm.topic_name = '';
    await fetchTopics(selectedRoundId.value);
  } catch (error) {
    snackbar.message = 'เกิดข้อผิดพลาด';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    topicLoading.value = false;
  }
};

// สร้าง Criteria
const createCriteria = async () => {
  if (!criteriaForm.topic_id || !criteriaForm.indicator_name) {
    snackbar.message = 'กรุณากรอกข้อมูลให้ครบ';
    snackbar.color = 'warning';
    snackbar.show = true;
    return;
  }
  criLoading.value = true;
  try {
    await api.post('/admin/criterias', {
      round_id: selectedRoundId.value,
      ...criteriaForm
    });
    snackbar.message = 'บันทึกตัวชี้วัดเรียบร้อย';
    snackbar.color = 'success';
    snackbar.show = true;
    
    criteriaForm.indicator_name = '';
    // ไม่ Reset topic_id เพื่อให้ user เพิ่มข้อต่อไปในหัวข้อเดิมได้เลย สะดวกกว่า
    await fetchCriterias(selectedRoundId.value);
  } catch (error) {
    snackbar.message = 'เกิดข้อผิดพลาด';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    criLoading.value = false;
  }
};
</script>