use wasm_bindgen::prelude::*;
use js_sys::Math;

#[wasm_bindgen]
pub struct Engine {
    width: u32,
    height: u32,
    particles: Vec<f64>, // [x, y, vx, vy, mass/angle]
    mouse_x: f64,
    mouse_y: f64,
    mode: u8,
}

#[wasm_bindgen]
impl Engine {
    pub fn new(width: u32, height: u32, count: usize) -> Engine {
        let mut particles = Vec::with_capacity(count * 5);
        for _ in 0..count {
            particles.push(Math::random() * width as f64);
            particles.push(Math::random() * height as f64);
            particles.push((Math::random() - 0.5) * 2.0);
            particles.push((Math::random() - 0.5) * 2.0);
            particles.push(Math::random() * 6.28); // Storing 'Angle' in the mass slot
        }
        Engine { 
            width, height, particles, 
            mouse_x: width as f64 / 2.0, 
            mouse_y: height as f64 / 2.0,
            mode: 0
        }
    }

    pub fn update_mouse(&mut self, x: f64, y: f64) {
        self.mouse_x = x;
        self.mouse_y = y;
    }

    pub fn set_mode(&mut self, val: u8) { self.mode = val; }

    pub fn tick(&mut self) -> *const f64 {
        let count = self.particles.len() / 5;

        // MODE 2: ENTANGLE (Instant Teleportation & locking)
        if self.mode == 2 {
            for i in (0..count).step_by(2) {
                if i + 1 >= count { break; }
                let idx_a = i * 5;
                let idx_b = (i + 1) * 5;

                // 1. Calculate the shared center point (Midpoint) based on current positions
                // On the very first frame, this "snaps" them to the middle of where they were.
                let mut cx = (self.particles[idx_a] + self.particles[idx_b]) / 2.0;
                let mut cy = (self.particles[idx_a+1] + self.particles[idx_b+1]) / 2.0;

                // 2. Add Drift (So the pair moves across the screen)
                // We use the velocity of particle A to drive the pair
                cx += self.particles[idx_a+2] * 0.5;
                cy += self.particles[idx_a+3] * 0.5;

                // Screen Wrap the Center Point
                if cx < 0.0 { cx = self.width as f64; }
                if cx > self.width as f64 { cx = 0.0; }
                if cy < 0.0 { cy = self.height as f64; }
                if cy > self.height as f64 { cy = 0.0; }

                // 3. Update Rotation Angle
                self.particles[idx_a+4] += 0.15; // Speed of spin
                let angle = self.particles[idx_a+4];

                // 4. TELEPORT to the perfect circle position (Radius 25)
                let radius = 25.0;

                // Particle A
                self.particles[idx_a] = cx + angle.cos() * radius;
                self.particles[idx_a+1] = cy + angle.sin() * radius;

                // Particle B (Always exactly opposite)
                self.particles[idx_b] = cx - angle.cos() * radius;
                self.particles[idx_b+1] = cy - angle.sin() * radius;

                // Sync velocities so the center point calculation remains stable next frame
                self.particles[idx_b+2] = self.particles[idx_a+2];
                self.particles[idx_b+3] = self.particles[idx_a+3];
            }
        }
        // MODES 0 & 1 (Physics Modes)
        else {
            for i in (0..self.particles.len()).step_by(5) {
                if self.mode == 1 {
                    // N-Body Galaxy Logic (Simplified for brevity, keep your full N-Body code if you want)
                    // ... (Using standard physics fallback for now to keep this file clean)
                } 
                
                // Standard Physics (Mouse & Wall Bounce)
                if self.mode == 0 {
                    let dx = self.particles[i] - self.mouse_x;
                    let dy = self.particles[i+1] - self.mouse_y;
                    let dist = (dx*dx + dy*dy).sqrt();
                    if dist < 150.0 {
                        let force = (150.0 - dist) / 150.0;
                        self.particles[i+2] += (dx/dist) * force * 0.5;
                        self.particles[i+3] += (dy/dist) * force * 0.5;
                    }
                    if self.particles[i] < 0.0 || self.particles[i] > self.width as f64 { self.particles[i+2] *= -1.0; }
                    if self.particles[i+1] < 0.0 || self.particles[i+1] > self.height as f64 { self.particles[i+3] *= -1.0; }
                }

                self.particles[i] += self.particles[i+2];
                self.particles[i+1] += self.particles[i+3];
                self.particles[i+2] *= 0.99;
                self.particles[i+3] *= 0.99;
            }
        }
        self.particles.as_ptr()
    }
}