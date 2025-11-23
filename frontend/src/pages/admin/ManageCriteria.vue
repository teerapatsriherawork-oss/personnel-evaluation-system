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
                
                <v-list-item v-for="t in topics" :key="t.id">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-label" color="secondary" size="small"></v-icon>
                  </template>
                  
                  <v-list-item-title>{{ t.topic_name }}</v-list-item-title>

                  <template v-slot:append>
                    <v-btn 
                      icon="mdi-pencil" 
                      size="x-small" 
                      variant="text" 
                      color="primary"
                      @click="openEditTopic(t)"
                    ></v-btn>
                    <v-btn 
                      icon="mdi-delete" 
                      size="x-small" 
                      variant="text" 
                      color="error"
                      @click="confirmDeleteTopic(t)"
                    ></v-btn>
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

                <v-text-field
                  v-model="criteriaForm.indicator_name"
                  label="ตัวชี้วัด (Indicator)"
                  placeholder="รายละเอียดสิ่งที่ต้องการวัด..."
                  variant="outlined"
                  density="compact"
                  required
                ></v-text-field>

                <v-textarea
                  v-model="criteriaForm.description"
                  label="รายละเอียดเกณฑ์ (Description)"
                  placeholder="อธิบายรายละเอียดของเกณฑ์นี้..."
                  variant="outlined"
                  rows="2"
                  density="compact"
                ></v-textarea>

                <v-row>
                  <v-col cols="6">
                    <v-text-field
                      v-model="criteriaForm.max_score"
                      label="คะแนนเต็ม"
                      type="number"
                      variant="outlined"
                      density="compact"
                      required
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <v-select
                      v-model="criteriaForm.scoring_type"
                      label="รูปแบบคะแนน"
                      :items="[{title:'Scale 1-4', value:'scale'}, {title:'Boolean (มี/ไม่มี)', value:'boolean'}]"
                      variant="outlined"
                      density="compact"
                    ></v-select>
                  </v-col>
                </v-row>

                <v-checkbox
                  v-model="criteriaForm.require_evidence"
                  label="จำเป็นต้องแนบหลักฐาน (Require Evidence)"
                  color="primary"
                  hide-details
                  class="mb-4"
                ></v-checkbox>

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
                  <th>หลักฐาน</th>
                  <th>จัดการ</th> </tr>
              </thead>
              <tbody>
                <tr v-for="item in criteriaList" :key="item.id">
                  <td class="font-weight-bold text-secondary">{{ item.topic_name }}</td>
                  <td>
                    <div>{{ item.indicator_name }}</div>
                    <div class="text-caption text-grey">{{ item.description }}</div>
                  </td>
                  <td>{{ item.max_score }}</td>
                  <td>
                    <v-icon v-if="item.require_evidence" color="error" size="small">mdi-paperclip</v-icon>
                    <span v-else class="text-grey">-</span>
                  </td>
                  <td>
                    <v-btn
                      icon="mdi-pencil"
                      size="x-small"
                      variant="text"
                      color="primary"
                      @click="openEditCriteria(item)"
                    ></v-btn>
                    <v-btn
                      icon="mdi-delete"
                      size="x-small"
                      variant="text"
                      color="error"
                      @click="confirmDeleteCriteria(item)"
                    ></v-btn>
                  </td>
                </tr>
                <tr v-if="criteriaList.length === 0">
                  <td colspan="5" class="text-center text-grey">ยังไม่มีข้อมูล</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-dialog v-model="editTopicDialog" max-width="400px">
      <v-card>
        <v-card-title class="bg-primary text-white">แก้ไขหัวข้อ</v-card-title>
        <v-card-text class="pt-4">
          <v-text-field
            v-model="editingTopic.topic_name"
            label="ชื่อหัวข้อ"
            variant="outlined"
            autofocus
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="editTopicDialog = false">ยกเลิก</v-btn>
          <v-btn color="success" @click="saveEditTopic">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteTopicDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-error">ยืนยันการลบหัวข้อ?</v-card-title>
        <v-card-text>
          คุณต้องการลบหัวข้อ <strong>"{{ topicToDelete?.topic_name }}"</strong> ใช่หรือไม่?<br>
          <small class="text-grey">* ตัวชี้วัดทั้งหมดภายใต้หัวข้อนี้จะถูกลบด้วย</small>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="deleteTopicDialog = false">ยกเลิก</v-btn>
          <v-btn color="error" variant="elevated" @click="submitDeleteTopic">ลบหัวข้อ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editCriteriaDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">แก้ไขตัวชี้วัด</v-card-title>
        <v-card-text class="pt-4">
          <v-form @submit.prevent="saveEditCriteria">
            <v-select
              v-model="editingCriteria.topic_id"
              :items="topics"
              item-title="topic_name"
              item-value="id"
              label="เลือกหัวข้อ (Topic)"
              variant="outlined"
              required
            ></v-select>

            <v-text-field
              v-model="editingCriteria.indicator_name"
              label="ตัวชี้วัด"
              variant="outlined"
              required
            ></v-text-field>

            <v-textarea
              v-model="editingCriteria.description"
              label="รายละเอียด"
              variant="outlined"
              rows="2"
            ></v-textarea>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="editingCriteria.max_score"
                  label="คะแนนเต็ม"
                  type="number"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-select
                  v-model="editingCriteria.scoring_type"
                  label="รูปแบบคะแนน"
                  :items="[{title:'Scale 1-4', value:'scale'}, {title:'Boolean', value:'boolean'}]"
                  variant="outlined"
                ></v-select>
              </v-col>
            </v-row>

            <v-checkbox
              v-model="editingCriteria.require_evidence"
              label="จำเป็นต้องแนบหลักฐาน"
              color="primary"
              hide-details
            ></v-checkbox>

            <div class="d-flex justify-end mt-4">
              <v-btn color="grey" variant="text" class="mr-2" @click="editCriteriaDialog = false">ยกเลิก</v-btn>
              <v-btn color="success" type="submit">บันทึก</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteCriteriaDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-error">ยืนยันการลบตัวชี้วัด?</v-card-title>
        <v-card-text>
          คุณต้องการลบตัวชี้วัด <strong>"{{ criteriaToDelete?.indicator_name }}"</strong> ใช่หรือไม่?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="deleteCriteriaDialog = false">ยกเลิก</v-btn>
          <v-btn color="error" variant="elevated" @click="submitDeleteCriteria">ลบตัวชี้วัด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

// Forms Create
const topicForm = reactive({ topic_name: '' });
const criteriaForm = reactive({
  topic_id: null,
  indicator_name: '',
  description: '',
  max_score: 10,
  scoring_type: 'scale',
  require_evidence: false
});

// Edit/Delete Topics
const editTopicDialog = ref(false);
const deleteTopicDialog = ref(false);
const editingTopic = reactive({ id: null, topic_name: '' });
const topicToDelete = ref(null);

// [NEW] Edit/Delete Criteria
const editCriteriaDialog = ref(false);
const deleteCriteriaDialog = ref(false);
const editingCriteria = reactive({});
const criteriaToDelete = ref(null);

onMounted(async () => {
  try {
    const res = await api.get('/admin/rounds');
    rounds.value = res.data.data;
  } catch (error) { console.error(error); }
});

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

// --- Manage Topics ---
const createTopic = async () => {
  if (!topicForm.topic_name) return;
  topicLoading.value = true;
  try {
    await api.post('/admin/topics', {
      round_id: selectedRoundId.value,
      topic_name: topicForm.topic_name
    });
    snackbar.message = 'เพิ่มหัวข้อสำเร็จ';
    snackbar.color = 'success';
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

const openEditTopic = (topic) => {
  editingTopic.id = topic.id;
  editingTopic.topic_name = topic.topic_name;
  editTopicDialog.value = true;
};

const saveEditTopic = async () => {
  if (!editingTopic.topic_name) return;
  try {
    await api.put(`/admin/topics/${editingTopic.id}`, { topic_name: editingTopic.topic_name });
    snackbar.message = 'แก้ไขหัวข้อสำเร็จ';
    snackbar.color = 'success';
    snackbar.show = true;
    editTopicDialog.value = false;
    await fetchTopics(selectedRoundId.value);
    await fetchCriterias(selectedRoundId.value);
  } catch (error) {
    snackbar.message = 'แก้ไขไม่สำเร็จ';
    snackbar.color = 'error';
    snackbar.show = true;
  }
};

const confirmDeleteTopic = (topic) => {
  topicToDelete.value = topic;
  deleteTopicDialog.value = true;
};

const submitDeleteTopic = async () => {
  if (!topicToDelete.value) return;
  try {
    await api.delete(`/admin/topics/${topicToDelete.value.id}`);
    snackbar.message = 'ลบหัวข้อสำเร็จ';
    snackbar.color = 'success';
    snackbar.show = true;
    deleteTopicDialog.value = false;
    await fetchTopics(selectedRoundId.value);
    await fetchCriterias(selectedRoundId.value);
  } catch (error) {
    snackbar.message = 'ลบไม่สำเร็จ';
    snackbar.color = 'error';
    snackbar.show = true;
  }
};

// --- Manage Criterias ---
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
    criteriaForm.description = '';
    criteriaForm.require_evidence = false;
    await fetchCriterias(selectedRoundId.value);
  } catch (error) {
    snackbar.message = 'เกิดข้อผิดพลาด';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    criLoading.value = false;
  }
};

// [NEW] Edit Criteria
const openEditCriteria = (item) => {
  Object.assign(editingCriteria, item);
  // เนื่องจาก boolean จาก DB อาจมาเป็น 0/1 ให้แปลงเป็น true/false ถ้าจำเป็น
  editingCriteria.require_evidence = !!item.require_evidence;
  editCriteriaDialog.value = true;
};

const saveEditCriteria = async () => {
  try {
    await api.put(`/admin/criterias/${editingCriteria.id}`, editingCriteria);
    snackbar.message = 'แก้ไขตัวชี้วัดสำเร็จ';
    snackbar.color = 'success';
    snackbar.show = true;
    editCriteriaDialog.value = false;
    await fetchCriterias(selectedRoundId.value);
  } catch (error) {
    snackbar.message = 'แก้ไขไม่สำเร็จ';
    snackbar.color = 'error';
    snackbar.show = true;
  }
};

// [NEW] Delete Criteria
const confirmDeleteCriteria = (item) => {
  criteriaToDelete.value = item;
  deleteCriteriaDialog.value = true;
};

const submitDeleteCriteria = async () => {
  if (!criteriaToDelete.value) return;
  try {
    await api.delete(`/admin/criterias/${criteriaToDelete.value.id}`);
    snackbar.message = 'ลบตัวชี้วัดสำเร็จ';
    snackbar.color = 'success';
    snackbar.show = true;
    deleteCriteriaDialog.value = false;
    await fetchCriterias(selectedRoundId.value);
  } catch (error) {
    snackbar.message = 'ลบไม่สำเร็จ';
    snackbar.color = 'error';
    snackbar.show = true;
  }
};
</script>