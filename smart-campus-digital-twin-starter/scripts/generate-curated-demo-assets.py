#!/usr/bin/env python3
"""Generate original lightweight GLB demo sculptures for the exhibition starter.

These assets are intentionally procedural and project-owned. They make the starter
richer out of the box while keeping the external provider pipeline optional.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "models" / "exhibition" / "curated-demo"


def rgba(hex_color: str) -> list[int]:
    value = hex_color.lstrip("#")
    if len(value) == 6:
        value += "ff"
    return [int(value[index:index + 2], 16) for index in range(0, 8, 2)]


def material(name: str, color: str, metallic: float = 0.0, roughness: float = 0.45) -> PBRMaterial:
    return PBRMaterial(
        name=name,
        baseColorFactor=rgba(color),
        metallicFactor=metallic,
        roughnessFactor=roughness,
    )


def apply_material(mesh: trimesh.Trimesh, mat: PBRMaterial, name: str) -> trimesh.Trimesh:
    mesh.visual = trimesh.visual.TextureVisuals(material=mat)
    mesh.metadata["name"] = name
    return mesh


def y_up(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
    # Most trimesh primitives are Z-up. Rotate once so exported geometry is Y-up.
    mesh.apply_transform(trimesh.transformations.rotation_matrix(-math.pi / 2, [1, 0, 0]))
    return mesh


def transformed(mesh: trimesh.Trimesh, translation=(0.0, 0.0, 0.0), scale=(1.0, 1.0, 1.0), rotation=None) -> trimesh.Trimesh:
    mesh = mesh.copy()
    mesh.apply_scale(scale)
    if rotation is not None:
        angle, axis = rotation
        mesh.apply_transform(trimesh.transformations.rotation_matrix(angle, axis))
    mesh.apply_translation(translation)
    return mesh


def export_scene(filename: str, meshes: list[trimesh.Trimesh], title: str, tags: list[str]) -> dict[str, object]:
    scene = trimesh.Scene()
    for index, mesh in enumerate(meshes):
        scene.add_geometry(mesh, node_name=f"{filename}-{index}", geom_name=f"{filename}-{index}")
    path = OUTPUT / f"{filename}.glb"
    path.write_bytes(trimesh.exchange.gltf.export_glb(scene))
    return {
        "id": filename,
        "title": title,
        "url": f"/models/exhibition/curated-demo/{filename}.glb",
        "source": "Smart Exhibition procedural demo collection",
        "license": "CC0-1.0",
        "credit": "Generated for this starter codebase",
        "tags": tags,
        "bytes": path.stat().st_size,
    }


def faceted_bust() -> list[trimesh.Trimesh]:
    marble = material("warm-white-marble", "#e9e4dc", 0.02, 0.28)
    dark = material("obsidian-plinth", "#202830", 0.35, 0.25)
    torso = y_up(trimesh.creation.icosphere(subdivisions=3, radius=1.0))
    torso = transformed(torso, translation=(0, 0.6, 0), scale=(0.95, 0.72, 0.54))
    head = y_up(trimesh.creation.icosphere(subdivisions=3, radius=0.57))
    head = transformed(head, translation=(0, 1.68, 0.02), scale=(0.82, 1.05, 0.88))
    neck = y_up(trimesh.creation.cylinder(radius=0.28, height=0.55, sections=32))
    neck = transformed(neck, translation=(0, 1.15, 0))
    nose = y_up(trimesh.creation.cone(radius=0.11, height=0.34, sections=16))
    nose = transformed(nose, translation=(0, 1.7, 0.49), rotation=(math.pi / 2, [1, 0, 0]))
    plinth = y_up(trimesh.creation.cylinder(radius=0.82, height=0.2, sections=48))
    plinth = transformed(plinth, translation=(0, 0.0, 0))
    return [
        apply_material(torso, marble, "torso"),
        apply_material(head, marble, "head"),
        apply_material(neck, marble, "neck"),
        apply_material(nose, marble, "nose"),
        apply_material(plinth, dark, "plinth"),
    ]


def amphora_vessel() -> list[trimesh.Trimesh]:
    ceramic = material("oxide-ceramic", "#a96d42", 0.08, 0.34)
    rim_mat = material("bronze-rim", "#b99a61", 0.72, 0.22)
    profile = np.array([
        [0.03, 0.0], [0.36, 0.04], [0.52, 0.25], [0.56, 0.55],
        [0.45, 0.92], [0.31, 1.25], [0.24, 1.5], [0.38, 1.66],
        [0.35, 1.78], [0.21, 1.82], [0.20, 1.95],
    ])
    vessel = trimesh.creation.revolve(profile, sections=64)
    vessel = y_up(vessel)
    rim = y_up(trimesh.creation.torus(major_radius=0.24, minor_radius=0.055, major_sections=56, minor_sections=16))
    rim = transformed(rim, translation=(0, 1.95, 0))
    base = y_up(trimesh.creation.cylinder(radius=0.42, height=0.1, sections=48))
    base = transformed(base, translation=(0, 0.03, 0))
    handles = []
    for side in (-1, 1):
        handle = y_up(trimesh.creation.torus(major_radius=0.42, minor_radius=0.055, major_sections=48, minor_sections=12))
        handle = transformed(handle, translation=(side * 0.48, 1.22, 0), scale=(0.62, 1.0, 1.0), rotation=(math.pi / 2, [0, 1, 0]))
        handles.append(apply_material(handle, rim_mat, f"handle-{side}"))
    return [apply_material(vessel, ceramic, "vessel"), apply_material(rim, rim_mat, "rim"), apply_material(base, rim_mat, "base"), *handles]


def orbital_rings() -> list[trimesh.Trimesh]:
    cyan = material("cyan-anodized", "#39c9e8", 0.84, 0.16)
    violet = material("violet-anodized", "#7973e8", 0.82, 0.2)
    silver = material("polished-silver", "#d7e1e8", 0.9, 0.12)
    meshes = []
    rotations = [(0.0, [1, 0, 0]), (math.pi / 2.8, [1, 0, 0]), (math.pi / 2.8, [0, 0, 1])]
    for index, rotation in enumerate(rotations):
        torus = y_up(trimesh.creation.torus(major_radius=0.85 + index * 0.13, minor_radius=0.065, major_sections=72, minor_sections=12))
        torus = transformed(torus, translation=(0, 1.14, 0), rotation=rotation)
        meshes.append(apply_material(torus, cyan if index != 1 else violet, f"orbit-{index}"))
    core = y_up(trimesh.creation.icosphere(subdivisions=3, radius=0.36))
    core = transformed(core, translation=(0, 1.14, 0))
    stem = y_up(trimesh.creation.cylinder(radius=0.08, height=1.0, sections=24))
    stem = transformed(stem, translation=(0, 0.52, 0))
    return [*meshes, apply_material(core, silver, "core"), apply_material(stem, silver, "stem")]


def crystal_cluster() -> list[trimesh.Trimesh]:
    palette = [
        material("crystal-cyan", "#67d7ec", 0.24, 0.18),
        material("crystal-blue", "#477ad4", 0.34, 0.2),
        material("crystal-violet", "#9367d4", 0.28, 0.22),
        material("crystal-ice", "#d6f4f8", 0.12, 0.16),
    ]
    specs = [(-0.42, 0.58, 0.1, 1.42, 0.23), (0.0, 0.82, -0.05, 1.9, 0.28), (0.38, 0.52, 0.13, 1.28, 0.22), (-0.16, 0.38, -0.35, 1.08, 0.2), (0.2, 0.42, 0.36, 1.16, 0.21)]
    meshes = []
    for index, (x, y, z, height, radius) in enumerate(specs):
        body = y_up(trimesh.creation.cylinder(radius=radius, height=height * 0.82, sections=6))
        body = transformed(body, translation=(x, y + height * 0.32, z), rotation=((index - 2) * 0.11, [0, 0, 1]))
        tip = y_up(trimesh.creation.cone(radius=radius, height=height * 0.28, sections=6))
        tip = transformed(tip, translation=(x, y + height * 0.87, z), rotation=((index - 2) * 0.11, [0, 0, 1]))
        meshes.append(apply_material(body, palette[index % len(palette)], f"crystal-body-{index}"))
        meshes.append(apply_material(tip, palette[index % len(palette)], f"crystal-tip-{index}"))
    rock = y_up(trimesh.creation.icosphere(subdivisions=2, radius=0.76))
    rock = transformed(rock, translation=(0, 0.2, 0), scale=(1.0, 0.42, 0.78))
    meshes.append(apply_material(rock, material("stone-base", "#38434b", 0.18, 0.55), "stone-base"))
    return meshes


def robot_totem() -> list[trimesh.Trimesh]:
    white = material("ceramic-white", "#e9eef1", 0.18, 0.2)
    black = material("graphite", "#171e25", 0.68, 0.2)
    cyan = material("light-module", "#3cdcff", 0.6, 0.12)
    body = transformed(trimesh.creation.box(extents=(0.92, 1.15, 0.62)), translation=(0, 0.86, 0))
    head = transformed(trimesh.creation.box(extents=(0.72, 0.58, 0.55)), translation=(0, 1.72, 0.02))
    waist = y_up(trimesh.creation.cylinder(radius=0.32, height=0.22, sections=24))
    waist = transformed(waist, translation=(0, 0.24, 0))
    eye = transformed(trimesh.creation.box(extents=(0.42, 0.11, 0.035)), translation=(0, 1.77, 0.31))
    core = y_up(trimesh.creation.cylinder(radius=0.2, height=0.08, sections=32))
    core = transformed(core, translation=(0, 0.93, 0.34), rotation=(math.pi / 2, [1, 0, 0]))
    arms = []
    for side in (-1, 1):
        arm = y_up(trimesh.creation.capsule(radius=0.12, height=0.62, count=[16, 16]))
        arm = transformed(arm, translation=(side * 0.62, 0.95, 0), rotation=(side * 0.18, [0, 0, 1]))
        arms.append(apply_material(arm, black, f"arm-{side}"))
    return [
        apply_material(body, white, "body"), apply_material(head, white, "head"),
        apply_material(waist, black, "waist"), apply_material(eye, cyan, "eye"),
        apply_material(core, cyan, "core"), *arms,
    ]


def wave_surface() -> list[trimesh.Trimesh]:
    count_x = 52
    count_z = 38
    xs = np.linspace(-1.05, 1.05, count_x)
    zs = np.linspace(-0.72, 0.72, count_z)
    vertices = []
    colors = []
    for z in zs:
        for x in xs:
            y = 0.72 + 0.19 * math.sin(x * 5.4 + z * 3.2) + 0.12 * math.cos(z * 7.1 - x * 2.1)
            vertices.append([x, y, z])
            normalized = (y - 0.41) / 0.62
            colors.append([int(52 + normalized * 74), int(126 + normalized * 94), int(200 + normalized * 48), 255])
    faces = []
    for z_index in range(count_z - 1):
        for x_index in range(count_x - 1):
            a = z_index * count_x + x_index
            b = a + 1
            c = a + count_x
            d = c + 1
            faces.extend([[a, c, b], [b, c, d]])
    surface = trimesh.Trimesh(vertices=np.array(vertices), faces=np.array(faces), process=False)
    surface.visual.vertex_colors = np.array(colors, dtype=np.uint8)
    surface.metadata["name"] = "parametric-wave"
    frame = transformed(trimesh.creation.box(extents=(2.25, 0.12, 1.62)), translation=(0, 0.16, 0))
    frame = apply_material(frame, material("wave-plinth", "#1d2d39", 0.72, 0.22), "wave-plinth")
    return [surface, frame]


def cylinder_between(a: np.ndarray, b: np.ndarray, radius: float, sections: int = 12) -> trimesh.Trimesh:
    vector = b - a
    length = float(np.linalg.norm(vector))
    mesh = trimesh.creation.cylinder(radius=radius, height=length, sections=sections)
    direction = vector / length
    transform = trimesh.geometry.align_vectors([0, 0, 1], direction)
    if transform is not None:
        mesh.apply_transform(transform)
    mesh.apply_translation((a + b) / 2)
    return mesh


def spiral_column() -> list[trimesh.Trimesh]:
    gold = material("champagne-metal", "#d2b87a", 0.82, 0.18)
    cobalt = material("cobalt-nodes", "#3777d7", 0.74, 0.16)
    points = []
    for index in range(46):
        t = index / 45
        angle = t * math.pi * 5.2
        radius = 0.52 + 0.08 * math.sin(t * math.pi * 3)
        points.append(np.array([math.cos(angle) * radius, 0.2 + t * 2.05, math.sin(angle) * radius]))
    meshes = []
    for index in range(len(points) - 1):
        meshes.append(apply_material(cylinder_between(points[index], points[index + 1], 0.045), gold, f"spiral-link-{index}"))
    for index in range(0, len(points), 5):
        node = y_up(trimesh.creation.icosphere(subdivisions=2, radius=0.12))
        node = transformed(node, translation=tuple(points[index]))
        meshes.append(apply_material(node, cobalt, f"spiral-node-{index}"))
    return meshes


def abstract_mask() -> list[trimesh.Trimesh]:
    ivory = material("ivory-shell", "#e6ddd0", 0.04, 0.3)
    ink = material("ink-inlay", "#20252b", 0.45, 0.23)
    gold = material("gold-mark", "#c9a75a", 0.82, 0.18)
    shell = y_up(trimesh.creation.icosphere(subdivisions=4, radius=1.0))
    shell = transformed(shell, translation=(0, 1.02, 0), scale=(0.7, 1.0, 0.3))
    eyes = []
    for side in (-1, 1):
        eye = y_up(trimesh.creation.uv_sphere(radius=0.18, count=[20, 12]))
        eye = transformed(eye, translation=(side * 0.25, 1.25, 0.29), scale=(1.2, 0.5, 0.18), rotation=(side * 0.2, [0, 0, 1]))
        eyes.append(apply_material(eye, ink, f"eye-{side}"))
    mark = y_up(trimesh.creation.capsule(radius=0.055, height=0.72, count=[12, 12]))
    mark = transformed(mark, translation=(0, 0.88, 0.31))
    base = y_up(trimesh.creation.cylinder(radius=0.67, height=0.14, sections=48))
    base = transformed(base, translation=(0, 0.04, 0))
    return [apply_material(shell, ivory, "mask-shell"), *eyes, apply_material(mark, gold, "vertical-mark"), apply_material(base, ink, "mask-base")]



def data_monolith() -> list[trimesh.Trimesh]:
    pearl = material("pearl-shell", "#e8edef", 0.16, 0.22)
    graphite = material("graphite-core", "#1d2830", 0.72, 0.2)
    cyan = material("cyan-data", "#36c8e8", 0.56, 0.14)
    slab = transformed(trimesh.creation.box(extents=(0.94, 2.2, 0.42)), translation=(0, 1.18, 0))
    inset = transformed(trimesh.creation.box(extents=(0.64, 1.64, 0.08)), translation=(0, 1.24, 0.25))
    base = y_up(trimesh.creation.cylinder(radius=0.68, height=0.16, sections=48))
    base = transformed(base, translation=(0, 0.08, 0))
    meshes = [
        apply_material(slab, pearl, "monolith-shell"),
        apply_material(inset, graphite, "monolith-inset"),
        apply_material(base, graphite, "monolith-base"),
    ]
    for index in range(7):
        width = 0.18 + (index % 3) * 0.1
        bar = transformed(
            trimesh.creation.box(extents=(width, 0.075, 0.035)),
            translation=(-0.18 + (index % 2) * 0.28, 0.68 + index * 0.18, 0.315),
        )
        meshes.append(apply_material(bar, cyan, f"data-bar-{index}"))
    return meshes


def mechanical_flower() -> list[trimesh.Trimesh]:
    silver = material("brushed-silver", "#cbd5da", 0.78, 0.2)
    cyan = material("cyan-petal", "#42cce9", 0.62, 0.16)
    violet = material("violet-core", "#746fd6", 0.68, 0.17)
    dark = material("dark-stem", "#28333a", 0.68, 0.24)
    stem = y_up(trimesh.creation.cylinder(radius=0.095, height=1.45, sections=24))
    stem = transformed(stem, translation=(0, 0.78, 0))
    hub = y_up(trimesh.creation.icosphere(subdivisions=3, radius=0.34))
    hub = transformed(hub, translation=(0, 1.58, 0))
    base = y_up(trimesh.creation.cylinder(radius=0.65, height=0.16, sections=48))
    base = transformed(base, translation=(0, 0.08, 0))
    meshes = [
        apply_material(stem, dark, "flower-stem"),
        apply_material(hub, violet, "flower-core"),
        apply_material(base, silver, "flower-base"),
    ]
    for index in range(10):
        angle = index / 10 * math.tau
        petal = y_up(trimesh.creation.icosphere(subdivisions=2, radius=0.48))
        petal.apply_scale((0.42, 0.16, 1.0))
        petal.apply_transform(trimesh.transformations.rotation_matrix(angle, [0, 1, 0]))
        petal.apply_transform(trimesh.transformations.rotation_matrix(-0.35, [1, 0, 0]))
        petal.apply_translation((math.sin(angle) * 0.66, 1.58, math.cos(angle) * 0.66))
        meshes.append(apply_material(petal, cyan if index % 2 == 0 else silver, f"petal-{index}"))
    return meshes


def resonance_arch() -> list[trimesh.Trimesh]:
    white = material("ceramic-arch", "#e9edeb", 0.12, 0.27)
    gold = material("champagne-edge", "#cbb273", 0.82, 0.16)
    cyan = material("signal-node", "#43cce9", 0.6, 0.14)
    meshes = []
    for side in (-1, 1):
        column = transformed(trimesh.creation.box(extents=(0.22, 1.45, 0.28)), translation=(side * 0.78, 0.76, 0))
        meshes.append(apply_material(column, white, f"arch-column-{side}"))
    points = []
    for index in range(17):
        angle = math.pi - index / 16 * math.pi
        points.append(np.array([math.cos(angle) * 0.78, 1.45 + math.sin(angle) * 0.78, 0.0]))
    for index in range(len(points) - 1):
        meshes.append(apply_material(cylinder_between(points[index], points[index + 1], 0.105, 16), gold, f"arch-link-{index}"))
    for index in (2, 6, 10, 14):
        node = y_up(trimesh.creation.icosphere(subdivisions=2, radius=0.12))
        node = transformed(node, translation=tuple(points[index]))
        meshes.append(apply_material(node, cyan, f"arch-node-{index}"))
    base = transformed(trimesh.creation.box(extents=(2.1, 0.14, 0.72)), translation=(0, 0.07, 0))
    meshes.append(apply_material(base, white, "arch-base"))
    return meshes


def nebula_lens() -> list[trimesh.Trimesh]:
    cyan = material("lens-cyan", "#4bcbe8", 0.48, 0.13)
    violet = material("lens-violet", "#7b6bd4", 0.62, 0.16)
    silver = material("lens-silver", "#d2dde2", 0.86, 0.12)
    dark = material("lens-plinth", "#202b32", 0.7, 0.22)
    core = y_up(trimesh.creation.uv_sphere(radius=0.67, count=[40, 24]))
    core = transformed(core, translation=(0, 1.35, 0), scale=(1.0, 1.0, 0.3))
    meshes = [apply_material(core, cyan, "lens-core")]
    for index, (radius, rotation) in enumerate([
        (0.86, (0.0, [1, 0, 0])),
        (1.02, (math.pi / 3.2, [1, 0, 0])),
        (1.14, (math.pi / 2.7, [0, 0, 1])),
    ]):
        ring = y_up(trimesh.creation.torus(major_radius=radius, minor_radius=0.045 + index * 0.01, major_sections=72, minor_sections=12))
        ring = transformed(ring, translation=(0, 1.35, 0), rotation=rotation)
        meshes.append(apply_material(ring, violet if index == 1 else silver, f"lens-ring-{index}"))
    stem = y_up(trimesh.creation.cylinder(radius=0.075, height=0.75, sections=20))
    stem = transformed(stem, translation=(0, 0.45, 0))
    base = y_up(trimesh.creation.cylinder(radius=0.66, height=0.14, sections=48))
    base = transformed(base, translation=(0, 0.07, 0))
    meshes.extend([apply_material(stem, silver, "lens-stem"), apply_material(base, dark, "lens-base")])
    return meshes


def folded_ribbon() -> list[trimesh.Trimesh]:
    cyan = material("ribbon-cyan", "#38c6e5", 0.76, 0.16)
    pearl = material("ribbon-pearl", "#dce5e8", 0.62, 0.18)
    dark = material("ribbon-base", "#202a31", 0.7, 0.22)
    points = []
    for index in range(30):
        t = index / 29
        angle = t * math.pi * 3.4
        points.append(np.array([
            math.sin(angle) * (0.35 + 0.35 * t),
            0.28 + t * 1.9,
            math.cos(angle * 0.72) * 0.42,
        ]))
    meshes = []
    for index in range(len(points) - 1):
        radius = 0.085 + 0.035 * math.sin(index / 29 * math.pi)
        meshes.append(apply_material(cylinder_between(points[index], points[index + 1], radius, 14), cyan if index % 2 == 0 else pearl, f"ribbon-segment-{index}"))
    for index in range(0, len(points), 5):
        node = y_up(trimesh.creation.icosphere(subdivisions=2, radius=0.13))
        node = transformed(node, translation=tuple(points[index]))
        meshes.append(apply_material(node, pearl, f"ribbon-node-{index}"))
    base = transformed(trimesh.creation.box(extents=(1.4, 0.14, 1.0)), translation=(0, 0.07, 0))
    meshes.append(apply_material(base, dark, "ribbon-base"))
    return meshes


def guardian_figure() -> list[trimesh.Trimesh]:
    white = material("guardian-shell", "#e3e7e5", 0.16, 0.25)
    graphite = material("guardian-graphite", "#263038", 0.68, 0.21)
    cyan = material("guardian-signal", "#42d0ec", 0.54, 0.13)
    torso = transformed(trimesh.creation.box(extents=(0.72, 1.0, 0.42)), translation=(0, 1.12, 0))
    head = y_up(trimesh.creation.icosphere(subdivisions=2, radius=0.34))
    head = transformed(head, translation=(0, 1.92, 0), scale=(0.9, 1.05, 0.86))
    core = y_up(trimesh.creation.cylinder(radius=0.16, height=0.055, sections=28))
    core = transformed(core, translation=(0, 1.18, 0.24), rotation=(math.pi / 2, [1, 0, 0]))
    meshes = [apply_material(torso, white, "guardian-torso"), apply_material(head, white, "guardian-head"), apply_material(core, cyan, "guardian-core")]
    for side in (-1, 1):
        arm = y_up(trimesh.creation.capsule(radius=0.105, height=0.75, count=[14, 14]))
        arm = transformed(arm, translation=(side * 0.52, 1.12, 0), rotation=(side * 0.22, [0, 0, 1]))
        leg = y_up(trimesh.creation.capsule(radius=0.12, height=0.72, count=[14, 14]))
        leg = transformed(leg, translation=(side * 0.2, 0.42, 0))
        meshes.extend([apply_material(arm, graphite, f"guardian-arm-{side}"), apply_material(leg, graphite, f"guardian-leg-{side}")])
    base = y_up(trimesh.creation.cylinder(radius=0.7, height=0.13, sections=48))
    base = transformed(base, translation=(0, 0.065, 0))
    meshes.append(apply_material(base, graphite, "guardian-base"))
    return meshes


def solar_orrery() -> list[trimesh.Trimesh]:
    gold = material("orrery-gold", "#d0ad62", 0.86, 0.15)
    silver = material("orrery-silver", "#d1dce0", 0.86, 0.12)
    cyan = material("orrery-cyan", "#3bcbe9", 0.55, 0.13)
    dark = material("orrery-base", "#202b32", 0.72, 0.22)
    meshes = []
    radii = [0.48, 0.72, 0.96]
    for index, radius in enumerate(radii):
        ring = y_up(trimesh.creation.torus(major_radius=radius, minor_radius=0.03 + index * 0.006, major_sections=72, minor_sections=10))
        ring = transformed(ring, translation=(0, 1.25, 0), rotation=((index - 1) * 0.32, [1, 0, 0]))
        meshes.append(apply_material(ring, gold if index != 1 else silver, f"orrery-ring-{index}"))
        planet = y_up(trimesh.creation.icosphere(subdivisions=2, radius=0.11 + index * 0.025))
        planet = transformed(planet, translation=(radius, 1.25 + index * 0.08, 0))
        meshes.append(apply_material(planet, cyan if index != 1 else gold, f"orrery-planet-{index}"))
    sun = y_up(trimesh.creation.icosphere(subdivisions=3, radius=0.28))
    sun = transformed(sun, translation=(0, 1.25, 0))
    stem = y_up(trimesh.creation.cylinder(radius=0.07, height=0.78, sections=20))
    stem = transformed(stem, translation=(0, 0.47, 0))
    base = y_up(trimesh.creation.cylinder(radius=0.66, height=0.14, sections=48))
    base = transformed(base, translation=(0, 0.07, 0))
    meshes.extend([apply_material(sun, gold, "orrery-sun"), apply_material(stem, silver, "orrery-stem"), apply_material(base, dark, "orrery-base")])
    return meshes


def porcelain_lotus() -> list[trimesh.Trimesh]:
    porcelain = material("porcelain-white", "#ece9e1", 0.06, 0.24)
    jade = material("jade-edge", "#61b8aa", 0.28, 0.18)
    gold = material("lotus-gold", "#c9a75f", 0.8, 0.17)
    dark = material("lotus-base", "#293239", 0.64, 0.24)
    meshes = []
    for ring_index, count in enumerate((9, 7)):
        radius = 0.58 if ring_index == 0 else 0.34
        height = 0.92 if ring_index == 0 else 1.08
        for index in range(count):
            angle = index / count * math.tau + ring_index * 0.22
            petal = y_up(trimesh.creation.icosphere(subdivisions=2, radius=0.42))
            petal.apply_scale((0.44, 0.22, 1.0))
            petal.apply_transform(trimesh.transformations.rotation_matrix(angle, [0, 1, 0]))
            petal.apply_transform(trimesh.transformations.rotation_matrix(-0.46 + ring_index * 0.15, [1, 0, 0]))
            petal.apply_translation((math.sin(angle) * radius, height, math.cos(angle) * radius))
            meshes.append(apply_material(petal, porcelain if index % 3 else jade, f"lotus-petal-{ring_index}-{index}"))
    core = y_up(trimesh.creation.icosphere(subdivisions=3, radius=0.25))
    core = transformed(core, translation=(0, 1.12, 0))
    stem = y_up(trimesh.creation.cylinder(radius=0.08, height=0.78, sections=22))
    stem = transformed(stem, translation=(0, 0.48, 0))
    base = y_up(trimesh.creation.cylinder(radius=0.68, height=0.14, sections=48))
    base = transformed(base, translation=(0, 0.07, 0))
    meshes.extend([apply_material(core, gold, "lotus-core"), apply_material(stem, jade, "lotus-stem"), apply_material(base, dark, "lotus-base")])
    return meshes

def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    definitions = [
        ("faceted-bust", faceted_bust(), "Faceted Memory Bust", ["sculpture", "portrait", "marble"]),
        ("amphora-vessel", amphora_vessel(), "Algorithmic Amphora", ["heritage", "ceramic", "vessel"]),
        ("orbital-rings", orbital_rings(), "Orbital Ring Study", ["kinetic", "metal", "abstract"]),
        ("crystal-cluster", crystal_cluster(), "Synthetic Crystal Archive", ["mineral", "futuristic", "cluster"]),
        ("robot-totem", robot_totem(), "Service Totem Prototype", ["industrial-design", "robot", "prototype"]),
        ("wave-surface", wave_surface(), "Topological Wave", ["generative", "surface", "data-art"]),
        ("spiral-column", spiral_column(), "Helical Signal Column", ["kinetic", "spiral", "lightweight"]),
        ("abstract-mask", abstract_mask(), "Future Ritual Mask", ["heritage", "mask", "abstract"]),
        ("data-monolith", data_monolith(), "Data Monolith", ["data-art", "monolith", "light"]),
        ("mechanical-flower", mechanical_flower(), "Mechanical Flower", ["kinetic", "botanical", "industrial-design"]),
        ("resonance-arch", resonance_arch(), "Resonance Arch", ["architecture", "sound", "sculpture"]),
        ("nebula-lens", nebula_lens(), "Nebula Lens", ["optical", "space", "installation"]),
        ("folded-ribbon", folded_ribbon(), "Folded Signal Ribbon", ["generative", "ribbon", "kinetic"]),
        ("guardian-figure", guardian_figure(), "Guardian Figure", ["figurative", "robotic", "sculpture"]),
        ("solar-orrery", solar_orrery(), "Solar Orrery", ["astronomy", "kinetic", "metal"]),
        ("porcelain-lotus", porcelain_lotus(), "Porcelain Lotus", ["ceramic", "botanical", "heritage"]),
    ]
    manifest = [export_scene(filename, meshes, title, tags) for filename, meshes, title, tags in definitions]
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {len(manifest)} GLB assets in {OUTPUT}")
    for item in manifest:
        print(f"  {item['id']}: {item['bytes']} bytes")


if __name__ == "__main__":
    main()
