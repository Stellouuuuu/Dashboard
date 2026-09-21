import { createContext, useContext, useEffect, useState } from "react";
import type { WidgetInstance, Widget } from "../types/widget";
import { dashboardService } from "../services/dashboard.service";
import { widgetsService } from "../services/widgets.service";

type WidgetContextType = {
  instances: WidgetInstance[];
  catalog: Widget[];
  loading: boolean;
  reloadInstances: () => Promise<void>;
  addWidget: (widgetId: number, config: any, refreshRate: number) => Promise<void>;
  removeWidget: (id: number) => Promise<void>;
  updatePosition: (id: number, x: number, y: number) => Promise<void>;
  reconfigureWidget: (id: number, config: any, refreshRate: number) => Promise<void>;
};

const WidgetContext = createContext<WidgetContextType | null>(null);

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  const [instances, setInstances] = useState<WidgetInstance[]>([]);
  const [catalog, setCatalog] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inst, cat] = await Promise.all([
        dashboardService.getInstances(),
        widgetsService.getCatalog(),
      ]);
      setInstances(inst);
      setCatalog(cat);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addWidget = async (widgetId: number, config: any, refreshRate: number) => {
    await dashboardService.addWidget(widgetId, config, refreshRate);
    await loadData();
  };

  const removeWidget = async (id: number) => {
    await dashboardService.deleteWidget(id);
    setInstances((prev) => prev.filter((i) => i.id !== id));
  };

  const updatePosition = async (id: number, x: number, y: number) => {
    // Optimistic update
    setInstances((prev) =>
      prev.map((i) => (i.id === id ? { ...i, positionX: x, positionY: y } : i))
    );
    await dashboardService.moveWidget(id, x, y);
  };

  const reconfigureWidget = async (id: number, config: any, refreshRate: number) => {
    await dashboardService.reconfigureWidget(id, config, refreshRate);
    await loadData();
  };

  return (
    <WidgetContext.Provider
      value={{
        instances,
        catalog,
        loading,
        reloadInstances: loadData,
        addWidget,
        removeWidget,
        updatePosition,
        reconfigureWidget,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
}

export function useWidgetContext() {
  const ctx = useContext(WidgetContext);
  if (!ctx) throw new Error("useWidgetContext must be used within WidgetProvider");
  return ctx;
}
