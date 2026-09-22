import { WidgetWrapper } from "./WidgetWrapper";
import type { WidgetInstance } from "../../types/widget";

type Props = { instance: WidgetInstance };
type FeedData = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
};

export default function FeedSummary({ instance }: Props) {
  const link = instance.config.link as string;

  return (
    <WidgetWrapper
      instance={instance}
      title="Flux RSS"
      render={(data: FeedData[]) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, color: "gray", marginBottom: 4 }}>
            Source: {data[0]?.source || link}
          </div>
          {data.map((item, idx) => (
            <a 
              key={idx} 
              href={item.link} 
              target="_blank" 
              rel="noreferrer"
              style={{ 
                display: "block", padding: 8, background: "var(--code-bg)", 
                borderRadius: 4, textDecoration: "none", color: "inherit"
              }}
            >
              <div style={{ fontSize: 13, fontWeight: "500", marginBottom: 4 }}>{item.title}</div>
              {item.pubDate && (
                <div style={{ fontSize: 11, color: "gray" }}>
                  {new Date(item.pubDate).toLocaleDateString()}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    />
  );
}
