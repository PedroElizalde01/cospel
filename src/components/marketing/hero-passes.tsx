"use client";

import { motion } from "motion/react";
import { WalletPassPreview, type WalletPlatform } from "@/components/pass/wallet-pass-preview";
import type { PassProject } from "@/lib/pass/schema";
import { Tilt } from "./tilt";

/** Three overlapping passes, fanned like a Wallet stack. Mixes Apple and Google renderings. */
export function HeroPasses({ passes }: { passes: { project: PassProject; platform: WalletPlatform }[] }) {
  const layout = [
    { x: -120, y: 40, r: -8, z: 1 },
    { x: 120, y: 20, r: 7, z: 2 },
    { x: 0, y: 0, r: 0, z: 3 },
  ];
  return (
    <Tilt className="relative mx-auto h-[460px] w-full max-w-[520px] sm:h-[520px]" max={4}>
      {passes.slice(0, 3).map(({ project: p, platform }, i) => (
        <motion.div
          key={p.id}
          className="absolute top-6 left-1/2"
          style={{ zIndex: layout[i].z }}
          initial={false}
          animate={{ x: `calc(-50% + ${layout[i].x}px)`, y: layout[i].y, rotate: layout[i].r }}
          whileHover={{ y: layout[i].y - 10 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
        >
          <div className="drop-shadow-[0_24px_40px_rgba(0,0,0,0.18)]">
            <WalletPassPreview project={p} platform={platform} scale={i === 2 ? 1 : platform === "google" ? 0.7 : 0.86} />
          </div>
        </motion.div>
      ))}
    </Tilt>
  );
}
