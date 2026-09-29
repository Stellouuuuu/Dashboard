import { Controller, Get } from "@nestjs/common";

const WIDGETS = [
  { id: 1, name: "city_temperature", service: "weather" },
  { id: 2, name: "recent_commits", service: "github" },
  { id: 3, name: "top_stories", service: "hackernews" },
];

@Controller()
export class WidgetsController {
  @Get("widgets")
  getWidgets() {
    return WIDGETS;
  }
}
