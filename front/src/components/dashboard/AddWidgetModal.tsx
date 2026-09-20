import { useState } from "react";
import WidgetConfigModal from "./WidgetConfigModal";
import type { Widget } from "../../types/widget";
import { useWidgets } from "../../hooks/useWidgets";

function AddWidgetModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { catalog } = useWidgets();
  const [selected, setSelected] = useState<Widget | null>(null);

  if (selected) {
    return (
      <WidgetConfigModal
        widget={selected}
        onClose={onClose}
        onAdded={onAdded}
      />
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9999 }}>
      <div style={{ background: "var(--bg)", padding: "20px", maxWidth: "400px", margin: "60px auto", borderRadius: 8 }}>
        <h3>Choisir un widget</h3>
        <div style={{ maxHeight: 400, overflowY: "auto", margin: "16px 0" }}>
          {catalog.map((w) => (
            <button 
              key={w.id} 
              onClick={() => setSelected(w)} 
              style={{ display: "block", width: "100%", textAlign: "left", padding: 12, margin: "8px 0", background: "var(--code-bg)", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", color: "var(--text)" }}
            >
              <div style={{ fontWeight: "bold", fontSize: 14 }}>{w.name}</div>
              <div style={{ fontSize: 12, color: "gray" }}>{w.description}</div>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ padding: "8px 16px", background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", width: "100%" }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

export default AddWidgetModal;