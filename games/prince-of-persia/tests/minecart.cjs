// The minecart uses real 3D track physics. Run its current regression suite.
import('./minecart-track.mjs').catch(error => { console.error(error); process.exitCode = 1; });
