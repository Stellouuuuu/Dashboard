import { useState, useEffect } from "react";
import { adminService } from "../services/admin.service";
import type { AdminStats as StatsType } from "../services/admin.service";

export default function AdminStats() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminService.getStats()
      .then(setStats)
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Chargement des statistiques...</div>;
  if (error) return <div style={{ color: "red" }}>Erreur : {error}</div>;
  if (!stats) return null;

  return (
    <div style={{ padding: 20 }}>
      <h2>Statistiques Globales</h2>
      
      <div style={{ display: "flex", gap: 20, marginBottom: 40 }}>
        <div style={{ padding: 20, background: "var(--code-bg)", borderRadius: 8, flex: 1 }}>
          <h3>Total Widgets</h3>
          <p style={{ fontSize: 32, fontWeight: "bold", margin: 0 }}>{stats.totalWidgets}</p>
        </div>
        <div style={{ padding: 20, background: "var(--code-bg)", borderRadius: 8, flex: 1 }}>
          <h3>Utilisateurs Actifs</h3>
          <p style={{ fontSize: 32, fontWeight: "bold", margin: 0 }}>{stats.activeUsers}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 40 }}>
        <div style={{ flex: 1 }}>
          <h3>Top Widgets</h3>
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: 8 }}>Widget</th>
                <th style={{ padding: 8 }}>Instances</th>
              </tr>
            </thead>
            <tbody>
              {stats.byWidget.map((w: any) => (
                <tr key={w.widgetSlug} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: 8 }}>{w.widgetName}</td>
                  <td style={{ padding: 8 }}>{w.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1 }}>
          <h3>Répartition par Statut</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stats.byStatus.map((s: any) => (
              <div key={s.status} style={{ display: "flex", justifyContent: "space-between", padding: 12, background: "var(--code-bg)", borderRadius: 8 }}>
                <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>{s.status}</span>
                <span>{s.count} instance(s)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
