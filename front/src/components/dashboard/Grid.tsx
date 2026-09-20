import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useWidgets } from "../../hooks/useWidgets";
import WidgetCard from "./WidgetCard";
import AddWidgetModal from "./AddWidgetModal";

function Grid() {
  const { instances, loading, updatePosition } = useWidgets();
  const [showModal, setShowModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const newIndex = instances.findIndex((i) => i.id === over.id);
      
      // In a real grid, you'd calculate actual X/Y, here we just use index as simple 1D order for demo
      // We trigger updatePosition to backend (simplified as x=index, y=0)
      const instanceId = Number(active.id);
      updatePosition(instanceId, newIndex, 0);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h2>Mon Dashboard</h2>
        <button onClick={() => setShowModal(true)} style={{ padding: "8px 16px", background: "var(--accent)", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
          + Ajouter un widget
        </button>
      </div>

      {showModal && <AddWidgetModal onClose={() => setShowModal(false)} onAdded={() => setShowModal(false)} />}

      {loading && <p>Chargement des widgets...</p>}

      {!loading && instances.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", background: "var(--code-bg)", borderRadius: 8 }}>
          <p>Aucun widget sur votre dashboard. Ajoutez-en un pour commencer !</p>
        </div>
      )}

      {!loading && instances.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={instances.map(i => i.id)} strategy={rectSortingStrategy}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {instances.map((instance) => (
                <WidgetCard key={instance.id} instance={instance} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

export default Grid;