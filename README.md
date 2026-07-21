# 3D Learn — Digital Twin Experiments

This public monorepo contains two browser-based 3D digital-twin prototypes.

- `smart-campus-digital-twin-starter/` — campus GIS/digital-twin starter, built with React, Vite and Three.js.
- `warehouse-sorting-digital-twin/` — standalone warehouse sorting scene, built with native Three.js modules and served as static files.

## Warehouse demo

The warehouse scene is designed to show mixed-SKU receiving, packing, automated sorting, carrier-robot replenishment, racking and outbound flow. It uses runtime assets from Kenney and Poly Haven; their bundled license files remain alongside the assets.

Serve it locally:

```bash
cd warehouse-sorting-digital-twin
docker run --rm -p 18081:80 -v "$PWD:/usr/share/nginx/html:ro" nginx:alpine
```

Then open `http://127.0.0.1:18081`.

## Collaboration request: robot-arm behavior

The current robot-arm behavior in `warehouse-sorting-digital-twin/app.js` is intentionally marked as the highest-priority improvement. The visual arm is not yet a convincing pick-and-place system.

Contributions are especially welcome for:

1. A real state machine: approach pile → acquire an actual SKU mesh → lift → transfer → release into a tote.
2. IK or constrained articulated animation for shoulder, elbow, wrist and gripper.
3. Gripper closing/opening, object parenting while grasped, and collision-safe placement.
4. Clear synchronization with the two Carrier robots and shelf-slot allocation.

Please keep the scene runnable as a static site and avoid adding private assets or credentials.
