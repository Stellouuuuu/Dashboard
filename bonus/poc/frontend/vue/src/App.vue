<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface WeatherWidgetData {
  city: string
  temperature: number
  condition: string
}

const MOCK_DATA: WeatherWidgetData = {
  city: 'Paris',
  temperature: 18,
  condition: 'Partly cloudy',
}

const data = ref<WeatherWidgetData | null>(null)

onMounted(() => {
  setTimeout(() => {
    data.value = MOCK_DATA
  }, 300)
})
</script>

<template>
  <main class="widget-card">
    <h1>Weather widget (Vue)</h1>
    <p v-if="data === null" class="widget-loading">Loading…</p>
    <dl v-else class="widget-body">
      <dt>City</dt>
      <dd>{{ data.city }}</dd>
      <dt>Temperature</dt>
      <dd>{{ data.temperature }}°C</dd>
      <dt>Condition</dt>
      <dd>{{ data.condition }}</dd>
    </dl>
  </main>
</template>

<style scoped>
.widget-card {
  max-width: 320px;
  margin: 4rem auto;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #ddd;
  font-family: system-ui, sans-serif;
  text-align: center;
}

.widget-loading {
  color: #888;
}

.widget-body {
  display: grid;
  grid-template-columns: auto auto;
  gap: 0.25rem 0.75rem;
  text-align: left;
  margin: 0;
}

.widget-body dt {
  font-weight: 600;
  color: #555;
}

.widget-body dd {
  margin: 0;
}
</style>
