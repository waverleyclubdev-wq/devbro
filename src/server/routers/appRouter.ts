import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const appRouter = router({
  getProfile: publicProcedure
    .output(z.object({
      headline: z.string(),
      tagline: z.string(),
      terminal_intro: z.string(),
      stack: z.array(z.string()),
    }))
    .query(() => {
      return {
       
        headline: "I write the code.",
        tagline: "You pay the electricity bill.", 
        
        
        terminal_intro: ">> HIJACKING LOCAL GPU FOR RENDERING...",
        
        stack: [
          "Core: Rust (particle_sim)",
          "Architecture: WASM (Client-Side)", 
          "Cost to Me: R0.00",                 
          "Cost to You: ~1% Battery",         
          "Protocol: tRPC"
        ]
      };
    }),
});

export type AppRouter = typeof appRouter;

