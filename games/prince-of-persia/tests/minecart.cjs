// Retain the existing test entrypoint for the true 3D track implementation.
import('./minecart-track.mjs').catch(error=>{console.error(error);process.exitCode=1});
