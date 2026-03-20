/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameCanvas } from './components/game/GameCanvas';
import { HUD } from './components/ui/HUD';
import { NanoBananaGenerator } from './components/game/NanoBananaGenerator';

export default function App() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* The 3D Game Scene */}
      <GameCanvas />
      
      {/* The Brutalist HUD Overlay */}
      <HUD />

      {/* The Nano Banana Asset Lab */}
      <NanoBananaGenerator />
    </main>
  );
}
