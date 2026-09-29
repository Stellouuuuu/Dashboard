import { Component, OnInit } from '@angular/core';

interface WeatherWidgetData {
  city: string;
  temperature: number;
  condition: string;
}

const MOCK_DATA: WeatherWidgetData = {
  city: 'Paris',
  temperature: 18,
  condition: 'Partly cloudy',
};

@Component({
  selector: 'app-root',
  imports: [],
  template: `
    <main class="widget-card">
      <h1>Weather widget (Angular)</h1>
      @if (data === null) {
        <p class="widget-loading">Loading…</p>
      } @else {
        <dl class="widget-body">
          <dt>City</dt>
          <dd>{{ data.city }}</dd>
          <dt>Temperature</dt>
          <dd>{{ data.temperature }}°C</dd>
          <dt>Condition</dt>
          <dd>{{ data.condition }}</dd>
        </dl>
      }
    </main>
  `,
  styles: [
    `
    .widget-card {
      max-width: 320px;
      margin: 4rem auto;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #ddd;
      font-family: system-ui, sans-serif;
      text-align: center;
    }
    .widget-loading { color: #888; }
    .widget-body {
      display: grid;
      grid-template-columns: auto auto;
      gap: 0.25rem 0.75rem;
      text-align: left;
      margin: 0;
    }
    .widget-body dt { font-weight: 600; color: #555; }
    .widget-body dd { margin: 0; }
    `,
  ],
})
export class AppComponent implements OnInit {
  data: WeatherWidgetData | null = null;

  ngOnInit(): void {
    setTimeout(() => {
      this.data = MOCK_DATA;
    }, 300);
  }
}
