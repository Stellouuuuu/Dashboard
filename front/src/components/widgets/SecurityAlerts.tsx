import { WidgetWrapper } from "./WidgetWrapper";
import type { WidgetInstance } from "../../types/widget";

type Props = { instance: WidgetInstance };
type AlertData = {
  number: number;
  package: string;
  summary: string;
  severity: string;
  url: string;
};

export default function SecurityAlerts({ instance }: Props) {
  const repo = instance.config.repository as string;

  return (
    <WidgetWrapper
      instance={instance}
      title={`Alertes: ${repo}`}
      render={(data: AlertData[]) => {
        if (data.length === 0) return <p>Aucune alerte de sécurité ! 🎉</p>;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.map((alert) => (
              <a 
                key={alert.number} 
                href={alert.url} 
                target="_blank" 
                rel="noreferrer"
                style={{ 
                  display: "block", padding: 8, background: "var(--code-bg)", 
                  borderRadius: 4, textDecoration: "none", color: "inherit"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <strong style={{ fontSize: 13 }}>{alert.package}</strong>
                  <span style={{ 
                    fontSize: 11, padding: "2px 6px", borderRadius: 4, 
                    background: alert.severity === "high" || alert.severity === "critical" ? "red" : "orange", 
                    color: "white" 
                  }}>
                    {alert.severity}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "gray" }}>{alert.summary}</div>
              </a>
            ))}
          </div>
        );
      }}
    />
  );
}
