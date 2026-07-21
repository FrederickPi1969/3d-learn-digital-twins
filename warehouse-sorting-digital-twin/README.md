# FLOWGRID Warehouse Sorting Twin

## Map plan

`收货月台 → 质检暂存 → A/B 高位货架 → 机器人拣选 → 主输送线/分拣口 → 复核出货`

Central aisle is reserved for forklifts/AGVs. The live scene highlights colored order cartons travelling through the picking and sortation path.

## Assets

Selected models are from **Kenney Factory Kit 3.0** under **CC0**. Original download and license are kept in `assets/source/` and `public/assets/kenney/License.txt`.

Included GLB assets: conveyors, cartons, robot arm, scanner, and routing arrow.

Run with any static server, e.g. `docker run --rm -p 18081:80 -v "$PWD:/usr/share/nginx/html:ro" nginx:alpine`.
