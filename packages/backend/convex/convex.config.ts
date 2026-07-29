import agent from "@convex-dev/agent/convex.config.js";
import geospatial from "@convex-dev/geospatial/convex.config.js";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(geospatial);
app.use(agent);

export default app;
