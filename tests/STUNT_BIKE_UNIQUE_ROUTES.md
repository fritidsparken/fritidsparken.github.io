# Individually authored expansion courses

The thirteen expansion courses now use explicit, different sequences of climbs, crests, descents, jumps and loops. They no longer repeat the same flat/loop/jump module. The opening ramp begins after the short starting platform. Plateau heights persist between obstacles, so routes traverse multiple elevations rather than returning to zero after every jump.

Each route has a distinct environment theme: park, copper bridge, cliffs, coast, neon district, suspension bridge, harbor, industry, mountains, illuminated gardens, canyon, rooftops and festival. Route-specific 3D landmarks reuse the existing materials, lighting, geometry cache and instancing. Natural routes have a sparser skyline so cliffs, vegetation and water are visible.

The original seven courses and physics remain unchanged. Redesigned expansion routes use versioned record IDs; earlier expansion records remain stored but are not compared with the new layouts.

Verification: every course can be completed by the physics driver, every new checkpoint can be restarted, all loops complete at suitable speed, missed ravine jumps fail normally. Tests assert thirteen distinct point profiles and thirteen environment themes. The scene harness checks all twenty courses and three quality settings at four canvas sizes; this is geometry testing, not GPU appearance or device-performance validation.
