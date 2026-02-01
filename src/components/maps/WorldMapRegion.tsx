import { motion } from "framer-motion";

// Import map images
import worldMapAfrica from "@/assets/maps/world-map-africa.webp";
import worldMapEurope from "@/assets/maps/world-map-europe.webp";
import worldMapAsia from "@/assets/maps/world-map-asia.webp";
import worldMapNorthAmerica from "@/assets/maps/world-map-north-america.webp";
import worldMapSouthAmerica from "@/assets/maps/world-map-south-america.webp";
import worldMapOceania from "@/assets/maps/world-map-oceania.webp";
import worldMapGlobal from "@/assets/maps/world-map-global.webp";

type Region = 
  | "africa" 
  | "europe" 
  | "asia" 
  | "north_america" 
  | "south_america" 
  | "oceania" 
  | "global";

interface WorldMapRegionProps {
  region: Region;
  className?: string;
}

const regionLabels: Record<Region, string> = {
  africa: "Africa",
  europe: "Europa",
  asia: "Asia",
  north_america: "Nord America",
  south_america: "Sud America",
  oceania: "Oceania",
  global: "Globale"
};

const regionToImage: Record<Region, string> = {
  africa: worldMapAfrica,
  europe: worldMapEurope,
  asia: worldMapAsia,
  north_america: worldMapNorthAmerica,
  south_america: worldMapSouthAmerica,
  oceania: worldMapOceania,
  global: worldMapGlobal
};

export const WorldMapRegion = ({ region, className = "" }: WorldMapRegionProps) => {
  const mapImage = regionToImage[region] || worldMapGlobal;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Region Label */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
        <span className="text-sm text-muted-foreground">
          Contributo verso: <span className="font-medium text-primary">{regionLabels[region]}</span>
        </span>
      </div>

      {/* World Map Image with pulse animation */}
      <motion.div
        className="relative w-full overflow-hidden rounded-lg"
        initial={{ opacity: 0.9 }}
        animate={{ opacity: [0.9, 1, 0.9] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <img 
          src={mapImage} 
          alt={`Mappa mondiale - ${regionLabels[region]}`}
          className="w-full h-auto max-h-[280px] object-contain"
          loading="lazy"
          decoding="async"
        />
      </motion.div>
    </div>
  );
};

export default WorldMapRegion;