import { useState } from "react";
import type { Widget } from "../../types/widget";
import { useWidgets } from "../../hooks/useWidgets";

type Props = {
  widget?: Widget; // For Add mode
  widgetId?: number; // For Edit mode
  instanceId?: number; // For Edit mode
  initialConfig?: Record<string, unknown>; // For Edit mode
  initialRefreshRate?: number; // For Edit mode
  onClose: () => void;
  onAdded?: () => void;
};

function WidgetConfigModal({
  widget,
  widgetId,
  instanceId,
  initialConfig,
  initialRefreshRate,
  onClose,
  onAdded,
}: Props) {
  const { addWidget, reconfigureWidget, catalog } = useWidgets();
  
  // Find widget schema either from prop or from catalog
  const targetWidget = widget || catalog.find(w => w.id === widgetId);
  
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (initialConfig) {
      return Object.entries(initialConfig).reduce((acc, [k, v]) => {
        acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>);
    }
    return {};
  });
  const [refreshRate, setRefreshRate] = useState(initialRefreshRate ?? 60);
  const [error, setError] = useState("");

  if (!targetWidget) return null;

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    for (const param of targetWidget.paramsSchema) {
      if (!values[param.name]) {
        setError(`Le champ "${param.name}" est requis.`);
        return;
      }
    }

    const config: Record<string, string | number> = {};
    for (const param of targetWidget.paramsSchema) {
      config[param.name] =
        param.type === "integer" ? Number(values[param.name]) : values[param.name];
    }

    try {
      if (instanceId) {
        // Edit mode
        await reconfigureWidget(instanceId, config, refreshRate);
      } else {
        // Add mode
        await addWidget(targetWidget.id, config, refreshRate);
        if (onAdded) onAdded();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sauvegarde");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9999 }}>
      <div style={{ background: "var(--bg)", padding: "20px", maxWidth: "400px", margin: "60px auto", borderRadius: 8 }}>
        <h3>{instanceId ? "Reconfigurer" : "Configurer"} {targetWidget.name}</h3>

        {targetWidget.paramsSchema.map((param) => (
          <div key={param.name} style={{ margin: "8px 0" }}>
            <label style={{ display: "block", marginBottom: 4 }}>{param.name}</label>
            <input
              style={{ width: "100%", padding: 8, background: "var(--code-bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 4 }}
              type={param.type === "integer" ? "number" : "text"}
              value={values[param.name] || ""}
              onChange={(e) => handleChange(param.name, e.target.value)}
            />
          </div>
        ))}

        <div style={{ margin: "16px 0" }}>
          <label style={{ display: "block", marginBottom: 4 }}>Rafraîchissement (secondes)</label>
          <input
            style={{ width: "100%", padding: 8, background: "var(--code-bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 4 }}
            type="number"
            min={30}
            value={refreshRate}
            onChange={(e) => setRefreshRate(Number(e.target.value))}
          />
        </div>

        {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}

        <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
          <button onClick={handleSubmit} style={{ padding: "8px 16px", background: "var(--accent)", color: "white", border: "none", borderRadius: 4, cursor: "pointer", flex: 1 }}>
            Confirmer
          </button>
          <button onClick={onClose} style={{ padding: "8px 16px", background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", flex: 1 }}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

export default WidgetConfigModal;