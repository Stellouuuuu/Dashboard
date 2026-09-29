import { useEffect, useState } from 'react'
import './App.css'

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

function App() {
  const [data, setData] = useState<WeatherWidgetData | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setData(MOCK_DATA), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="widget-card">
      <h1>Weather widget (React)</h1>
      {data === null ? (
        <p className="widget-loading">Loading…</p>
      ) : (
        <dl className="widget-body">
          <dt>City</dt>
          <dd>{data.city}</dd>
          <dt>Temperature</dt>
          <dd>{data.temperature}°C</dd>
          <dt>Condition</dt>
          <dd>{data.condition}</dd>
        </dl>
      )}
    </main>
  )
}

export default App
