use wasm_bindgen::prelude::*;
use js_sys::Math;

#[wasm_bindgen]
pub struct Engine {
    width: u32,
    height: u32,
    particles: Vec<f64>, // [x, y, vx, vy, mass]
    mouse_x: f64,
    mouse_y: f64,
}

#[wasm_bindgen]
impl Engine {
    pub fn new(width: u32, height: u32, count: usize) -> Engine {
        let mut particles = Vec::with_capacity(count * 5);
        for _ in 0..count {
            particles.push(Math::random() * width as f64);      // x
            particles.push(Math::random() * height as f64);     // y
            // Faster starting speed for chaos
            particles.push((Math::random() - 0.5) * 2.0);       // vx 
            particles.push((Math::random() - 0.5) * 2.0);       // vy
            particles.push(Math::random() * 2.0 + 0.5);         // mass
        }
        Engine { 
            width, height, particles, 
            mouse_x: -1000.0, mouse_y: -1000.0,
        }
    }

    pub fn update_mouse(&mut self, x: f64, y: f64) {
        self.mouse_x = x;
        self.mouse_y = y;
    }

    pub fn tick(&mut self) -> *const f64 {
        // LINEAR PHYSICS LOOP (O(N))
        // We can handle thousands of particles because we only look at them one by one
        for i in (0..self.particles.len()).step_by(5) {
            
            // 1. Mouse Repulsion/Attraction
            let dx = self.particles[i] - self.mouse_x;
            let dy = self.particles[i+1] - self.mouse_y;
            let dist_sq = dx * dx + dy * dy;
            let dist = dist_sq.sqrt();

            // If mouse is close (Interaction Radius)
            if dist < 200.0 {
                let force = (200.0 - dist) / 200.0;
                // Push away gently
                self.particles[i+2] += (dx / dist) * force * 0.8;
                self.particles[i+3] += (dy / dist) * force * 0.8;
            }

            // 2. Wall Bounce
            if self.particles[i] < 0.0 { 
                self.particles[i] = 0.0; 
                self.particles[i+2] *= -1.0; 
            }
            if self.particles[i] > self.width as f64 { 
                self.particles[i] = self.width as f64; 
                self.particles[i+2] *= -1.0; 
            }
            if self.particles[i+1] < 0.0 { 
                self.particles[i+1] = 0.0; 
                self.particles[i+3] *= -1.0; 
            }
            if self.particles[i+1] > self.height as f64 { 
                self.particles[i+1] = self.height as f64; 
                self.particles[i+3] *= -1.0; 
            }

            // 3. Move
            self.particles[i] += self.particles[i+2];
            self.particles[i+1] += self.particles[i+3];

            // 4. Friction (Keep them from exploding infinitely)
            self.particles[i+2] *= 0.99;
            self.particles[i+3] *= 0.99;
        }
        
        self.particles.as_ptr()
    }
}
// use wasm_bindgen::prelude::*;

// #[wasm_bindgen]
// pub struct Universe {
//     width: u32,
//     height: u32,
//     particles: Vec<f32>, // [x, y, previous_x, previous_y]
//     count: usize,
//     a: f32, b: f32, c: f32, d: f32, // The "Shape DNA" variables
// }

// #[wasm_bindgen]
// impl Universe {
//     pub fn new(width: u32, height: u32, count: usize) -> Universe {
//         let mut particles = Vec::with_capacity(count * 4);
//         // Start particles randomly
//         for _ in 0..count {
//             particles.push(0.0); // x
//             particles.push(0.0); // y
//             particles.push(0.0); // old_x
//             particles.push(0.0); // old_y
//         }

//         Universe { 
//             width, height, particles, count,
//             a: 1.5, b: -1.8, c: 1.6, d: 0.9 // Starting DNA
//         }
//     }

//     pub fn tick(&mut self, _mouse_x: f32, _mouse_y: f32, time: f32) -> *const f32 {
//         // 1. Morph the shape DNA slowly over time
//         // This makes the kaleidoscope "fold" and change patterns
//         self.a = (time * 0.1).sin() * 2.0;
//         self.b = (time * 0.13).cos() * 2.0;
//         self.c = (time * 0.17).sin() * 2.0;
//         self.d = (time * 0.07).cos() * 2.0;

//         for p in self.particles.chunks_exact_mut(4) {
//             // Save old position for "Streak" drawing
//             p[2] = p[0];
//             p[3] = p[1];

//             // 2. THE CLIFFORD ATTRACTOR FORMULA
//             // x' = sin(a * y) + c * cos(a * x)
//             // y' = sin(b * x) + d * cos(b * y)
            
//             // Note: These values are usually between -2.0 and 2.0
//             let x = p[0];
//             let y = p[1];
            
//             let next_x = (self.a * y).sin() + self.c * (self.a * x).cos();
//             let next_y = (self.b * x).sin() + self.d * (self.b * y).cos();

//             p[0] = next_x;
//             p[1] = next_y;
//         }

//         self.particles.as_ptr()
//     }
// }