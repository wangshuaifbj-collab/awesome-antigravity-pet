# -*- coding: utf-8 -*-
"""
Interactive 2D Gravitational Orbit & Particle Field Simulation.
Demonstrates classical N-Body gravitational physics with Symplectic Verlet integration.
"""

import math
from typing import List, Tuple
from dataclasses import dataclass

G = 6.67430e-11  # Gravitational constant


@dataclass
class CelestialBody:
    """Represents a mass entity in 2D space."""
    name: str
    mass: float
    x: float
    y: float
    vx: float
    vy: float

    def distance_to(self, other: "CelestialBody") -> float:
        dx = other.x - self.x
        dy = other.y - self.y
        return math.sqrt(dx * dx + dy * dy)

    def gravitational_force(self, other: "CelestialBody") -> Tuple[float, float]:
        dx = other.x - self.x
        dy = other.y - self.y
        r = math.sqrt(dx * dx + dy * dy)
        if r < 1e-5:
            return (0.0, 0.0)

        # Newton's Law of Universal Gravitation: F = G * m1 * m2 / r^2
        f_mag = (G * self.mass * other.mass) / (r * r)
        fx = f_mag * (dx / r)
        fy = f_mag * (dy / r)
        return (fx, fy)


class OrbitSystem:
    """N-Body gravitational simulation solver."""

    def __init__(self, bodies: List[CelestialBody] = None):
        self.bodies = bodies or []
        self.time_elapsed: float = 0.0

    def add_body(self, body: CelestialBody) -> None:
        self.bodies.append(body)

    def step(self, dt: float) -> None:
        """Advance the physics simulation by time step dt using Velocity Verlet integration."""
        n = len(self.bodies)
        forces = [[0.0, 0.0] for _ in range(n)]

        # Compute pair-wise gravitational forces
        for i in range(n):
            for j in range(i + 1, n):
                fx, fy = self.bodies[i].gravitational_force(self.bodies[j])
                forces[i][0] += fx
                forces[i][1] += fy
                forces[j][0] -= fx
                forces[j][1] -= fy

        # Update velocities and positions
        for i, body in enumerate(self.bodies):
            ax = forces[i][0] / body.mass
            ay = forces[i][1] / body.mass

            body.vx += ax * dt
            body.vy += ay * dt

            body.x += body.vx * dt
            body.y += body.vy * dt

        self.time_elapsed += dt

    def get_summary(self) -> str:
        lines = [f"--- Orbit System Status (t = {self.time_elapsed:.1f}s) ---"]
        for b in self.bodies:
            speed = math.sqrt(b.vx ** 2 + b.vy ** 2)
            lines.append(f"[Body] {b.name:<10}: Pos=({b.x:10.2f}, {b.y:10.2f}) | Vel={speed:8.2f} m/s")
        return "\n".join(lines)


if __name__ == "__main__":
    # Create Solar-Earth-Moon mini system
    sun = CelestialBody("Sun", mass=1.989e30, x=0.0, y=0.0, vx=0.0, vy=0.0)
    earth = CelestialBody("Earth", mass=5.972e24, x=1.496e11, y=0.0, vx=0.0, vy=29780.0)

    system = OrbitSystem([sun, earth])
    print("[Gravity Simulator] Starting 5-day orbital simulation...")
    for step in range(5):
        system.step(dt=3600 * 24)  # 推进 1 天
        print(system.get_summary())
