import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { WidgetInstance } from "../../types/widget";
import { useWidgets } from "../../hooks/useWidgets";
import PrecipitationForecast from "../widgets/PrecipitationForecast";
import SecurityAlerts from "../widgets/SecurityAlerts";
import FeedSummary from "../widgets/FeedSummary";
import WidgetConfigModal from "./WidgetConfigModal";

type Props = {
  instance: WidgetInstance;
};

function WidgetCard({ instance }: Props) {
  const { removeWidget } = useWidgets();
  const [showConfig, setShowConfig] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: instance.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    border: "1px solid var(--border)",
    borderRadius: 8,
    background: "var(--bg)",
    boxShadow: "var(--shadow)",
    display: "flex",
    flexDirection: "column" as const,
    minHeight: 250,
    zIndex: isDragging ? 999 : 1,
  };

  const renderWidgetContent = () => {
    switch (instance.widgetSlug) {
      case "precipitation_forecast":
        return <PrecipitationForecast instance={instance} />;
      case "security_alerts":
        return <SecurityAlerts instance={instance} />;
      case "feed_summary":
        return <FeedSummary instance={instance} />;
      default:
        // Pour les widgets du Membre A (ou non gérés ici)
        return (
          <div style={{ padding: 16, textAlign: "center" }}>
            Widget non supporté par Membre B: {instance.widgetSlug}
          </div>
        );
    }
  };

  return (
    <>
      <div ref={setNodeRef} style={style}>
        {/* Handle de Drag */}
        <div
          {...attributes}
          {...listeners}
          style={{
            background: "var(--code-bg)",
            padding: "8px 12px",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            cursor: "grab",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: "bold" }}>
            {instance.widgetName}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button 
              onPointerDown={(e) => e.stopPropagation()} 
              onClick={() => setShowConfig(true)}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16 }}
            >
              ⚙️
            </button>
            <button 
              onPointerDown={(e) => e.stopPropagation()} 
              onClick={() => removeWidget(instance.id)}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16 }}
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1 }}>
          {renderWidgetContent()}
        </div>
      </div>

      {showConfig && (
        <WidgetConfigModal
          widgetId={instance.widgetId}
          instanceId={instance.id}
          initialConfig={instance.config}
          initialRefreshRate={instance.refreshRate}
          onClose={() => setShowConfig(false)}
        />
      )}
    </>
  );
}

export default WidgetCard;