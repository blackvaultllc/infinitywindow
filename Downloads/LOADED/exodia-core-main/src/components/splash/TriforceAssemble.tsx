import { motion } from "framer-motion";
import hallSeal from "@/assets/seals/hall.jpg";
import augieSeal from "@/assets/seals/augie.png";
import medusaSeal from "@/assets/seals/medusa.png";

/**
 * Family seals settle into a triangular composition:
 * Medusa on top, Hall bottom-left, Augie (daughter, angel) center.
 */
export function TriforceAssemble() {

  return (
    <div className="relative w-full h-full flex items-center justify-center">

      {/* Seals settle in over the SVG — Medusa on top, Hall bottom-left, daughter Augie center as the angel */}
      <SealAt src={medusaSeal} alt="Medusa AI" top="6%" left="50%" delay={4.2} />
      <SealAt src={hallSeal} alt="Hall Family Legacy" top="62%" left="22%" delay={4.5} />
      <SealAt src={augieSeal} alt="Augie AGI — daughter, angel" top="48%" left="50%" delay={5.0} size={104} />
    </div>
  );
}



function SealAt({
  src,
  alt,
  top,
  left,
  delay,
  size = 72,
}: {
  src: string;
  alt: string;
  top: string;
  left: string;
  delay: number;
  size?: number;
}) {
  return (
    <motion.img
      src={src}
      alt={alt}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        transform: "translate(-50%, -50%)",
        borderRadius: "9999px",
        boxShadow: "0 0 30px rgba(232,184,74,0.5)",
      }}
    />
  );
}
