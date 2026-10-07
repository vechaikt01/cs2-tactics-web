import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus, X, Trash2, Pencil, Play, ChevronDown, ChevronRight,
  Search, Shield, Swords, Image as ImageIcon, Link2, MapPin,
  Loader2, Save, AlertTriangle, Crosshair, Download, Upload, Zap, Copy, Check,
  Cloud, Flame, Sparkles, Layers, Table2, Map as MapIcon, Tag, Target,
  Info, Users,
} from "lucide-react";

/* ---------------------------------------------------------
   TOKENS
   bg-base #0E1117 · bg-panel #141A22 · bg-card #1B232E
   border #2A3340 · ct #5B9BD5 · t #E0A458
   text #E8EAED · muted #8A93A3 · ok #6FCF97 · danger #E2574C
--------------------------------------------------------- */

const DEFAULT_MAPS = [
  "Dust2", "Mirage", "Inferno", "Nuke", "Ancient",
  "Anubis", "Overpass", "Vertigo", "Train",
];

// Tên callout là thuật ngữ cộng đồng dùng chung cho mọi trang radar CS2
// (Van, Jungle, Catwalk, Mid...), không phải nội dung sáng tạo riêng của
// bất kỳ trang nào — toạ độ là ước lượng vị trí tương đối (%) trên ảnh map.
// Đây chỉ là bộ callout GỢI Ý MẶC ĐỊNH; người dùng có thể sửa/xoá/thêm
// bằng nút "Thêm callout" như bình thường — khi đó bộ mặc định sẽ được
// "chốt" lại thành dữ liệu thật của map đó.
const DEFAULT_CALLOUTS = {
  Mirage: [
    { id: "def-van", x: 15.4, y: 12.5, label: "Van" },
    { id: "def-plat", x: 19.9, y: 10.7, label: "Plat" },
    { id: "def-bapts", x: 29.4, y: 11.0, label: "B Appartments" },
    { id: "def-tapts", x: 57.6, y: 9.3, label: "House / T Apts" },
    { id: "def-tv", x: 64.0, y: 7.7, label: "TV" },
    { id: "def-aptsramp", x: 69.5, y: 13.2, label: "Apts Ramp" },
    { id: "def-backalley", x: 42.9, y: 15.6, label: "Back Alley" },
    { id: "def-kitchen", x: 36.2, y: 19.0, label: "Kitchen" },
    { id: "def-jail", x: 9.4, y: 17.0, label: "Jail" },
    { id: "def-benchtl", x: 11.3, y: 22.4, label: "Bench" },
    { id: "def-arches", x: 28.0, y: 21.2, label: "Arches" },
    { id: "def-bshort", x: 36.9, y: 24.8, label: "B Short" },
    { id: "def-sidealley", x: 61.4, y: 27.0, label: "Side Alley" },
    { id: "def-cubby", x: 59.2, y: 23.6, label: "Cubby" },
    { id: "def-bdefault", x: 19.7, y: 19.2, label: "Default (B)" },
    { id: "def-bboost", x: 21.6, y: 20.1, label: "Boost (B)" },
    { id: "def-safe", x: 17.3, y: 27.6, label: "Safe" },
    { id: "def-empty", x: 16.6, y: 29.9, label: "Empty" },
    { id: "def-bingarbage", x: 13.1, y: 33.6, label: "Bin / Garbage" },
    { id: "def-door", x: 14.3, y: 37.9, label: "Door" },
    { id: "def-window", x: 21.5, y: 38.5, label: "Window" },
    { id: "def-market", x: 18.8, y: 44.5, label: "Market" },
    { id: "def-checkout", x: 26.2, y: 44.2, label: "Checkout" },
    { id: "def-sneakyshelf", x: 14.9, y: 47.9, label: "Sneaky / Shelf" },
    { id: "def-ebox", x: 27.1, y: 36.0, label: "E Box" },
    { id: "def-ladderroom", x: 34.9, y: 33.9, label: "Ladder Room" },
    { id: "def-underpass", x: 37.8, y: 31.2, label: "Underpass" },
    { id: "def-vent", x: 34.9, y: 40.6, label: "Vent" },
    { id: "def-snipersnest", x: 35.7, y: 44.8, label: "Sniper's Nest / Window" },
    { id: "def-catwalk", x: 46.4, y: 41.0, label: "Catwalk" },
    { id: "def-mid", x: 47.2, y: 47.4, label: "Mid" },
    { id: "def-topmid", x: 60.9, y: 41.7, label: "Top Mid" },
    { id: "def-cartmidboxes", x: 60.5, y: 47.6, label: "Cart / Mid boxes" },
    { id: "def-chair", x: 50.2, y: 53.3, label: "Chair" },
    { id: "def-2ndchair", x: 59.9, y: 53.9, label: "2nd Chair" },
    { id: "def-benchmid", x: 40.5, y: 50.2, label: "Bench" },
    { id: "def-ratshole", x: 31.9, y: 54.6, label: "Rat Hole" },
    { id: "def-connector", x: 43.8, y: 57.1, label: "Connector" },
    { id: "def-jungle", x: 35.8, y: 66.2, label: "Jungle" },
    { id: "def-stairs", x: 46.4, y: 69.2, label: "Stairs" },
    { id: "def-sandwich", x: 49.9, y: 69.4, label: "Sandwich" },
    { id: "def-tetris", x: 54.0, y: 67.6, label: "Tetris" },
    { id: "def-rampmain", x: 63.3, y: 72.6, label: "Ramp / Main" },
    { id: "def-troof", x: 69.5, y: 69.6, label: "TRoof" },
    { id: "def-apex", x: 58.1, y: 74.3, label: "Apex" },
    { id: "def-benchct", x: 41.7, y: 77.6, label: "Bench" },
    { id: "def-balcony", x: 56.5, y: 82.1, label: "Balcony" },
    { id: "def-palacepillars", x: 66.3, y: 84.6, label: "Palace Pillars" },
    { id: "def-palace", x: 58.9, y: 90.0, label: "Palace" },
    { id: "def-triple", x: 44.6, y: 83.5, label: "Triple" },
    { id: "def-adefault", x: 50.7, y: 84.2, label: "Default (A)" },
    { id: "def-firebox", x: 51.5, y: 89.2, label: "Fire Box" },
    { id: "def-ninja", x: 47.7, y: 90.2, label: "Ninja" },
    { id: "def-ct", x: 32.0, y: 90.4, label: "CT" },
    { id: "def-trashboost", x: 36.8, y: 88.7, label: "Trash / Boost" },
    { id: "def-ticketbooth", x: 38.7, y: 95.4, label: "Ticket Booth" },
  ],
  Ancient: [
    { id: "def-plat", x: 14.0, y: 15.0, label: "Plat" },
    { id: "def-temple", x: 37.0, y: 16.0, label: "Temple" },
    { id: "def-ctspawn", x: 51.0, y: 15.0, label: "CT Spawn" },
    { id: "def-single", x: 21.0, y: 21.0, label: "Single" },
    { id: "def-ctlane", x: 40.0, y: 22.0, label: "CT Lane" },
    { id: "def-bigbox", x: 11.0, y: 27.0, label: "Big Box" },
    { id: "def-asite", x: 30.0, y: 26.0, label: "A Site" },
    { id: "def-snipersnest", x: 47.0, y: 27.0, label: "Snipers Nest" },
    { id: "def-alley", x: 61.0, y: 26.0, label: "Alley" },
    { id: "def-backhalls", x: 76.0, y: 26.0, label: "Back Halls" },
    { id: "def-triplebox", x: 39.0, y: 32.0, label: "Triple Box" },
    { id: "def-square", x: 76.0, y: 32.0, label: "Square" },
    { id: "def-long", x: 18.0, y: 35.0, label: "Long" },
    { id: "def-boost", x: 25.0, y: 34.0, label: "Boost" },
    { id: "def-short", x: 31.0, y: 38.0, label: "Short" },
    { id: "def-topmid", x: 47.0, y: 40.0, label: "Top Mid" },
    { id: "def-pillar", x: 89.0, y: 41.0, label: "Pillar" },
    { id: "def-house", x: 66.0, y: 39.0, label: "House" },
    { id: "def-dark", x: 59.0, y: 42.0, label: "Dark" },
    { id: "def-bsite", x: 76.0, y: 43.0, label: "B Site" },
    { id: "def-amain", x: 19.0, y: 44.0, label: "A Main" },
    { id: "def-ahalls", x: 23.0, y: 49.0, label: "A Halls" },
    { id: "def-tunnels", x: 31.0, y: 46.0, label: "Tunnels" },
    { id: "def-pit", x: 52.0, y: 47.0, label: "Pit" },
    { id: "def-mid", x: 48.0, y: 52.0, label: "Mid" },
    { id: "def-lamproom", x: 62.0, y: 51.0, label: "Lamp Room" },
    { id: "def-tlower", x: 73.0, y: 54.0, label: "T Lower" },
    { id: "def-ramp", x: 82.0, y: 53.0, label: "Ramp" },
    { id: "def-stairs", x: 23.0, y: 58.0, label: "Stairs" },
    { id: "def-elbow", x: 39.0, y: 58.0, label: "Elbow" },
    { id: "def-xbox", x: 49.0, y: 58.0, label: "Xbox" },
    { id: "def-heaven", x: 59.0, y: 59.0, label: "Heaven" },
    { id: "def-window", x: 56.0, y: 64.0, label: "Window" },
    { id: "def-doors", x: 87.0, y: 63.0, label: "Doors" },
    { id: "def-split", x: 31.0, y: 68.0, label: "Split" },
    { id: "def-ruins", x: 76.0, y: 68.0, label: "Ruins" },
    { id: "def-water", x: 70.0, y: 74.0, label: "Water" },
    { id: "def-tunnel", x: 60.0, y: 78.0, label: "Tunnel" },
    { id: "def-tspawn", x: 49.0, y: 86.0, label: "T Spawn" },
  ],
  Inferno: [
    { id: "def-coffins", x: 40.0, y: 4.0, label: "Coffins" },
    { id: "def-garden", x: 51.0, y: 3.0, label: "Garden" },
    { id: "def-sandbags1", x: 77.0, y: 3.0, label: "Sand Bags" },
    { id: "def-dark", x: 46.0, y: 8.0, label: "Dark" },
    { id: "def-construction", x: 64.0, y: 7.0, label: "Construction" },
    { id: "def-fountain", x: 37.0, y: 11.0, label: "Fountain" },
    { id: "def-bsite", x: 48.0, y: 12.0, label: "B Site" },
    { id: "def-grill", x: 58.0, y: 9.0, label: "Grill" },
    { id: "def-truck", x: 70.0, y: 9.0, label: "Truck" },
    { id: "def-quad", x: 41.0, y: 16.0, label: "Quad" },
    { id: "def-ct", x: 60.0, y: 15.0, label: "CT" },
    { id: "def-tree", x: 68.0, y: 13.0, label: "Tree" },
    { id: "def-well", x: 80.0, y: 13.0, label: "Well" },
    { id: "def-terrace", x: 91.0, y: 15.0, label: "Terrace" },
    { id: "def-ctspawn", x: 90.0, y: 21.0, label: "CT Spawn" },
    { id: "def-2nd1st", x: 50.0, y: 17.0, label: "2nd / 1st" },
    { id: "def-ctboost", x: 62.0, y: 18.0, label: "CT Boost" },
    { id: "def-speedway", x: 75.0, y: 21.0, label: "Speed Way" },
    { id: "def-boost", x: 45.0, y: 21.0, label: "Boost" },
    { id: "def-car", x: 50.0, y: 24.0, label: "Car" },
    { id: "def-logs", x: 34.0, y: 29.0, label: "Logs" },
    { id: "def-banana", x: 47.0, y: 29.0, label: "Banana" },
    { id: "def-sandbags2", x: 58.0, y: 28.0, label: "Sand Bags" },
    { id: "def-longcorner", x: 62.0, y: 32.0, label: "Long Corner" },
    { id: "def-arch", x: 78.0, y: 32.0, label: "Arch" },
    { id: "def-kitchen", x: 90.0, y: 32.0, label: "Kitchen" },
    { id: "def-library", x: 95.0, y: 36.0, label: "Library" },
    { id: "def-ledge", x: 26.0, y: 38.0, label: "Ledge" },
    { id: "def-tramp", x: 36.0, y: 38.0, label: "T Ramp" },
    { id: "def-underpassbench", x: 56.0, y: 38.0, label: "Underpass Bench" },
    { id: "def-along", x: 76.0, y: 38.0, label: "A Long" },
    { id: "def-boiler", x: 64.0, y: 42.0, label: "Boiler" },
    { id: "def-topmid", x: 70.0, y: 44.0, label: "Top Mid" },
    { id: "def-backsite", x: 78.0, y: 42.0, label: "Back Site" },
    { id: "def-asite", x: 81.0, y: 45.0, label: "A Site" },
    { id: "def-graveyard", x: 93.0, y: 46.0, label: "Grave Yard" },
    { id: "def-bottommid", x: 44.0, y: 42.0, label: "Bottom Mid" },
    { id: "def-mid", x: 50.0, y: 45.0, label: "Mid" },
    { id: "def-stairs1", x: 60.0, y: 48.0, label: "Stairs" },
    { id: "def-ashort", x: 71.0, y: 48.0, label: "A Short" },
    { id: "def-closeleft", x: 78.0, y: 48.0, label: "Close Left" },
    { id: "def-livingroombalcony", x: 38.0, y: 50.0, label: "Living Room Balcony" },
    { id: "def-2ndmid", x: 44.0, y: 52.0, label: "2nd Mid" },
    { id: "def-window", x: 60.0, y: 51.0, label: "Window" },
    { id: "def-patio", x: 72.0, y: 51.0, label: "Patio" },
    { id: "def-truckcemetary", x: 84.0, y: 52.0, label: "Truck Cemetary" },
    { id: "def-tapps", x: 37.0, y: 56.0, label: "T Apps" },
    { id: "def-backalley", x: 44.0, y: 59.0, label: "Back Alley" },
    { id: "def-2ndmiddoor", x: 40.0, y: 62.0, label: "2nd Mid Door" },
    { id: "def-stairs2", x: 65.0, y: 58.0, label: "Stairs" },
    { id: "def-ctapps", x: 69.0, y: 55.0, label: "CT Apps" },
    { id: "def-closeapps", x: 78.0, y: 60.0, label: "Close Apps" },
    { id: "def-balcony", x: 85.0, y: 60.0, label: "Balcony" },
    { id: "def-pitdosia", x: 93.0, y: 58.0, label: "Pit Dosia" },
    { id: "def-bridge", x: 30.0, y: 65.0, label: "Bridge" },
    { id: "def-tspawn", x: 18.0, y: 64.0, label: "T Spawn" },
  ],
  Anubis: [
    { id: "def-beach", x: 45.0, y: 5.0, label: "Beach" },
    { id: "def-backasite", x: 69.0, y: 8.0, label: "Back A Site" },
    { id: "def-fountain", x: 85.0, y: 9.0, label: "Fountain" },
    { id: "def-ctspawn", x: 28.0, y: 14.0, label: "CT Spawn" },
    { id: "def-tunnel", x: 61.0, y: 14.0, label: "Tunnel" },
    { id: "def-sniper", x: 22.0, y: 20.0, label: "Sniper" },
    { id: "def-heaven1", x: 67.0, y: 16.0, label: "Heaven" },
    { id: "def-cave", x: 31.0, y: 21.0, label: "Cave" },
    { id: "def-asite", x: 76.0, y: 24.0, label: "A Site" },
    { id: "def-palace", x: 40.0, y: 25.0, label: "Palace" },
    { id: "def-plateau", x: 70.0, y: 27.0, label: "Plateau" },
    { id: "def-middle", x: 54.0, y: 28.0, label: "Middle" },
    { id: "def-aconnector", x: 65.0, y: 32.0, label: "A Connector" },
    { id: "def-default", x: 22.0, y: 37.0, label: "Default" },
    { id: "def-corner", x: 13.0, y: 40.0, label: "Corner" },
    { id: "def-bsite", x: 34.0, y: 38.0, label: "B Site" },
    { id: "def-headshot", x: 63.0, y: 38.0, label: "Headshot" },
    { id: "def-ninja", x: 46.0, y: 41.0, label: "Ninja" },
    { id: "def-ivy", x: 10.0, y: 44.0, label: "Ivy" },
    { id: "def-gate", x: 18.0, y: 44.0, label: "Gate" },
    { id: "def-backsite", x: 31.0, y: 43.0, label: "Back Site" },
    { id: "def-pillar", x: 36.0, y: 44.0, label: "Pillar" },
    { id: "def-doubledoors", x: 58.0, y: 43.0, label: "Double Doors" },
    { id: "def-ebox", x: 40.0, y: 47.0, label: "E Box" },
    { id: "def-drop", x: 88.0, y: 44.0, label: "Drop" },
    { id: "def-blong", x: 20.0, y: 50.0, label: "B Long" },
    { id: "def-bridge", x: 48.0, y: 51.0, label: "Bridge" },
    { id: "def-water", x: 57.0, y: 51.0, label: "Water" },
    { id: "def-boat", x: 76.0, y: 50.0, label: "Boat" },
    { id: "def-arches", x: 54.0, y: 54.0, label: "Arches" },
    { id: "def-wood", x: 69.0, y: 54.0, label: "Wood" },
    { id: "def-upper", x: 82.0, y: 50.0, label: "Upper" },
    { id: "def-topmid", x: 46.0, y: 56.0, label: "Top Mid" },
    { id: "def-stairs", x: 71.0, y: 54.0, label: "Stairs" },
    { id: "def-heaven2", x: 14.0, y: 58.0, label: "Heaven" },
    { id: "def-ruins", x: 40.0, y: 58.0, label: "Ruins" },
    { id: "def-alley", x: 63.0, y: 59.0, label: "Alley" },
    { id: "def-tspawn", x: 36.0, y: 76.0, label: "T Spawn" },
  ],
  Dust2: [
    { id: "def-backplat", x: 7.0, y: 2.0, label: "Back Plat" },
    { id: "def-bwindow", x: 34.0, y: 8.0, label: "B Window" },
    { id: "def-ninja", x: 73.0, y: 7.0, label: "Ninja" },
    { id: "def-goose", x: 77.0, y: 5.0, label: "Goose" },
    { id: "def-bbacksite", x: 20.0, y: 12.0, label: "B Back Site" },
    { id: "def-barrels", x: 83.0, y: 12.0, label: "Barrels" },
    { id: "def-aramp", x: 87.0, y: 13.0, label: "A Ramp" },
    { id: "def-bplat", x: 11.0, y: 16.0, label: "B Plat" },
    { id: "def-scaffolding", x: 39.0, y: 16.0, label: "Scaffolding" },
    { id: "def-aplat", x: 75.0, y: 15.0, label: "A Plat" },
    { id: "def-adefaultplant", x: 80.0, y: 17.0, label: "A Default Plant" },
    { id: "def-doublestack", x: 25.0, y: 18.0, label: "Double Stack" },
    { id: "def-bsite", x: 23.0, y: 16.0, label: "B" },
    { id: "def-bigbox", x: 13.0, y: 20.0, label: "Big Box" },
    { id: "def-ctmid", x: 46.0, y: 18.0, label: "CT Mid" },
    { id: "def-across", x: 86.0, y: 20.0, label: "A Cross" },
    { id: "def-fence", x: 7.0, y: 24.0, label: "Fence" },
    { id: "def-ctspawn", x: 58.0, y: 21.0, label: "CT Spawn" },
    { id: "def-shortboost", x: 71.0, y: 22.0, label: "Short Boost" },
    { id: "def-ashort", x: 66.0, y: 20.0, label: "A Short" },
    { id: "def-elevator", x: 78.0, y: 22.0, label: "Elevator" },
    { id: "def-bdoors", x: 27.0, y: 23.0, label: "B Doors" },
    { id: "def-acar", x: 91.0, y: 26.0, label: "A Car" },
    { id: "def-close", x: 7.0, y: 30.0, label: "Close" },
    { id: "def-bcar", x: 19.0, y: 27.0, label: "B Car" },
    { id: "def-middoors", x: 45.0, y: 28.0, label: "Mid Doors" },
    { id: "def-closemiddoors", x: 54.0, y: 27.0, label: "Close Mid Doors" },
    { id: "def-bboxes", x: 33.0, y: 29.0, label: "B Boxes" },
    { id: "def-stairs", x: 63.0, y: 29.0, label: "Stairs" },
    { id: "def-along", x: 83.0, y: 33.0, label: "A Long" },
    { id: "def-bcloset", x: 19.0, y: 32.0, label: "B Closet" },
    { id: "def-lowertunnels", x: 35.0, y: 34.0, label: "Lower Tunnels" },
    { id: "def-xbox", x: 39.0, y: 33.0, label: "Xbox" },
    { id: "def-uppertunnels", x: 16.0, y: 40.0, label: "Upper Tunnels" },
    { id: "def-mid", x: 45.0, y: 36.0, label: "Mid" },
    { id: "def-catwalk", x: 49.0, y: 37.0, label: "Catwalk" },
    { id: "def-blue", x: 70.0, y: 38.0, label: "Blue" },
    { id: "def-longcorner", x: 79.0, y: 35.0, label: "Long Corner" },
    { id: "def-palm", x: 36.0, y: 41.0, label: "Palm" },
    { id: "def-rightsidemid", x: 39.0, y: 42.0, label: "Right Side Mid" },
    { id: "def-topmid", x: 52.0, y: 43.0, label: "Top Mid" },
    { id: "def-pitplat", x: 94.0, y: 38.0, label: "Pit Plat" },
    { id: "def-longdoors", x: 68.0, y: 41.0, label: "Long Doors" },
    { id: "def-sidepit", x: 76.0, y: 41.0, label: "Side Pit" },
    { id: "def-pit", x: 83.0, y: 40.0, label: "Pit" },
    { id: "def-outsidetunnels", x: 18.0, y: 47.0, label: "Outside Tunnels" },
    { id: "def-suicide", x: 45.0, y: 49.0, label: "Suicide" },
    { id: "def-outsidelong", x: 68.0, y: 45.0, label: "Outside Long" },
    { id: "def-tramp", x: 11.0, y: 55.0, label: "T Ramp" },
    { id: "def-tplat", x: 18.0, y: 55.0, label: "T Plat" },
    { id: "def-tspawn", x: 41.0, y: 55.0, label: "T Spawn" },
  ],
  // Nuke có 2 tầng (xem getFloors/Nuke auto-seed phía dưới) nên callout mặc
  // định được gắn cho đúng khoá tầng 1 ("Nuke__f1") — danh sách này khớp với
  // ảnh overview Nuke mới nhất người dùng gửi (gồm cả khu vực outside và
  // đường vent dẫn vào B site hiển thị lồng trên cùng 1 ảnh).
  "Nuke__f1": [
    { id: "def-bottomramp", x: 20.0, y: 4.0, label: "Bottom Ramp" },
    { id: "def-dark", x: 26.0, y: 10.0, label: "Dark" },
    { id: "def-window", x: 31.0, y: 15.0, label: "Window" },
    { id: "def-bsite", x: 18.0, y: 20.0, label: "B Site" },
    { id: "def-doors", x: 28.0, y: 20.0, label: "Doors" },
    { id: "def-tunnels", x: 38.0, y: 23.0, label: "Tunnels" },
    { id: "def-deconvent", x: 10.0, y: 26.0, label: "DE_CON Vent" },
    { id: "def-backvents", x: 16.0, y: 28.0, label: "Back Vents" },
    { id: "def-secret1", x: 17.0, y: 32.0, label: "Secret" },
    { id: "def-headshot", x: 58.0, y: 18.0, label: "Headshot" },
    { id: "def-ramp", x: 58.0, y: 23.0, label: "Ramp" },
    { id: "def-mustang", x: 45.0, y: 27.0, label: "Mustang" },
    { id: "def-bigbox", x: 62.0, y: 25.0, label: "Big Box" },
    { id: "def-control", x: 42.0, y: 30.0, label: "Control" },
    { id: "def-trophy", x: 41.0, y: 33.0, label: "Trophy" },
    { id: "def-turnpike", x: 64.0, y: 28.0, label: "Turn Pike" },
    { id: "def-stack", x: 65.0, y: 31.0, label: "Stack" },
    { id: "def-hell", x: 73.0, y: 25.0, label: "Hell" },
    { id: "def-rafters", x: 64.0, y: 33.0, label: "Rafters" },
    { id: "def-heaven", x: 67.0, y: 34.0, label: "Heaven" },
    { id: "def-sandbags", x: 37.0, y: 37.0, label: "Sand Bags" },
    { id: "def-radio", x: 43.0, y: 38.0, label: "Radio" },
    { id: "def-lockers", x: 65.0, y: 37.0, label: "Lockers" },
    { id: "def-ctspawn", x: 82.0, y: 32.0, label: "CT Spawn" },
    { id: "def-ctbox", x: 75.0, y: 38.0, label: "CT Box" },
    { id: "def-lobby", x: 34.0, y: 44.0, label: "Lobby" },
    { id: "def-asite", x: 54.0, y: 44.0, label: "A Site" },
    { id: "def-hut", x: 57.0, y: 46.0, label: "Hut" },
    { id: "def-bridge", x: 63.0, y: 43.0, label: "Bridge" },
    { id: "def-tspawn", x: 12.0, y: 48.0, label: "T Spawn" },
    { id: "def-squeaky", x: 37.0, y: 49.0, label: "Squeaky" },
    { id: "def-troof", x: 35.0, y: 52.0, label: "T Roof" },
    { id: "def-tetris", x: 54.0, y: 48.0, label: "Tetris" },
    { id: "def-vent", x: 34.0, y: 55.0, label: "Vent" },
    { id: "def-silo", x: 50.0, y: 55.0, label: "Silo" },
    { id: "def-main", x: 58.0, y: 55.0, label: "Main" },
    { id: "def-ctred", x: 65.0, y: 53.0, label: "CT Red" },
    { id: "def-outside", x: 60.0, y: 59.0, label: "Outside" },
    { id: "def-garage", x: 72.0, y: 58.0, label: "Garage" },
    { id: "def-tred", x: 67.0, y: 62.0, label: "T Red" },
    { id: "def-secret2", x: 73.0, y: 62.0, label: "Secret" },
  ],
};

const SIDE_META = {
  CT: { color: "#5B9BD5", label: "CT", icon: Shield },
  T: { color: "#E0A458", label: "T", icon: Swords },
};

// Phân loại nade: dựa theo từ khóa xuất hiện trong tên / mô tả / role / ghi
// chú của chiến thuật (không phân biệt hoa thường). Một chiến thuật có thể
// thuộc nhiều loại cùng lúc (ví dụ vừa "smoke" vừa "flash") — khi đó nó
// được tính vào TẤT CẢ các loại khớp, và thêm vào mục "combination".
// csnades.gg hiển thị mỗi loại nade bằng 1 icon tròn đơn giản (dấu "i"),
// chỉ khác nhau ở màu — mình dùng lại đúng kiểu đó (icon gốc, không copy
// file của họ) để danh sách "Loại nade" trông giống hệt về bố cục/màu sắc.
const CATEGORY_META = {
  smoke: { label: "Smokes", color: "#C9CDD6", icon: Info },
  molotov: { label: "Molotovs", color: "#E2574C", icon: Info },
  flash: { label: "Flashbangs", color: "#E8D44D", icon: Info },
  grenade: { label: "Grenades", color: "#6FCF97", icon: Target },
  combination: { label: "Combinations", color: "#9B6FCF", icon: Layers },
};
const CATEGORY_ORDER = ["smoke", "molotov", "flash", "grenade", "combination"];
const CATEGORY_KEYWORDS = { smoke: "smoke", molotov: "molotov", flash: "flash", grenade: "grenade" };
// Nhãn ngắn gọn cho ô chọn "Loại nade" trong từng role (số ít, dễ đọc hơn
// nhãn số nhiều dùng ở bộ lọc sidebar).
const NADE_TYPE_OPTIONS = [
  { value: "", label: "— Chọn loại nade —" },
  { value: "smoke", label: "Smoke" },
  { value: "molotov", label: "Molotov" },
  { value: "flash", label: "Flashbang" },
  { value: "grenade", label: "Grenade (HE)" },
];

function classifyTactic(tactic) {
  const fromNadeType = (tactic.assignments || []).map((a) => a.nadeType).filter(Boolean);
  const haystack = [
    tactic.name,
    tactic.description,
    ...(tactic.assignments || []).map((a) => `${a.role || ""} ${a.note || ""}`),
  ].join(" ").toLowerCase();
  const matched = Object.keys(CATEGORY_KEYWORDS).filter((key) => haystack.includes(CATEGORY_KEYWORDS[key]));
  const categories = [...new Set([...fromNadeType, ...matched])];
  if (categories.length >= 2) categories.push("combination");
  return categories;
}

// Phân loại RIÊNG cho 1 role trong 1 chiến thuật — dùng cho "Bản đồ Nade",
// vì 1 chiến thuật có thể có nhiều role, mỗi người ném 1 loại nade khác
// nhau (vd: 1 người ném smoke, 1 người ném flash cùng lúc). Ưu tiên loại
// nade được CHỌN TRỰC TIẾP trong ô "Loại nade" của role đó; nếu chưa chọn,
// mới dò theo từ khoá trong text như trước (để tương thích dữ liệu cũ).
function classifyAssignment(tactic, a) {
  if (a.nadeType) return [a.nadeType];
  const haystack = `${a.role || ""} ${a.note || ""}`.toLowerCase();
  const matched = Object.keys(CATEGORY_KEYWORDS).filter((key) => haystack.includes(CATEGORY_KEYWORDS[key]));
  if (matched.length) {
    const categories = [...matched];
    if (matched.length >= 2) categories.push("combination");
    return categories;
  }
  // Role không ghi rõ loại nade → tạm dùng phân loại chung của cả chiến thuật.
  return tactic._categories || classifyTactic(tactic);
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// Một số map (Nuke, Vertigo…) có nhiều tầng với ảnh sơ đồ khác nhau cho
// mỗi tầng. mapImages[mapName] có thể là:
//  - chuỗi URL (map 1 tầng, kiểu cũ, không đổi)
//  - mảng [{id, label, url}] (map nhiều tầng)
// getFloors() chuẩn hoá cả 2 dạng về cùng 1 kiểu mảng để code còn lại dùng
// chung, không cần phân biệt map 1 tầng hay nhiều tầng.
function getFloors(mapImages, mapName) {
  const v = mapImages[mapName];
  if (Array.isArray(v)) return v;
  if (v) return [{ id: "default", label: "", url: v }];
  return [];
}

function parseYoutube(url) {
  if (!url) return null;
  try {
    let id = null, start = 0;
    const u = new URL(url.trim());
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.replace("/", "");
    } else if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v");
      if (!id && u.pathname.startsWith("/embed/")) id = u.pathname.split("/embed/")[1];
    }
    const t = u.searchParams.get("t");
    if (t) {
      if (/^\d+$/.test(t)) start = parseInt(t, 10);
      else {
        const hh = t.match(/(\d+)h/), mm = t.match(/(\d+)m/), ss = t.match(/(\d+)s/);
        start = (hh ? parseInt(hh[1]) * 3600 : 0) + (mm ? parseInt(mm[1]) * 60 : 0) + (ss ? parseInt(ss[1]) : 0);
      }
    }
    if (!id) return null;
    return { id, start };
  } catch {
    return null;
  }
}

// Embedding YouTube videos in an <iframe> inside Electron is unreliable —
// depending on the video's own embedding settings and the app's origin,
// it can fail with YouTube's "Error 153" overlay or a generic browser
// "This content is blocked" page. Rather than trying to embed at all,
// video links are always opened in the system's default browser, landing
// at the exact timestamp — this works for every video, every time.
function formatTimestamp(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// Áp một thứ tự mới cho một nhóm con (ví dụ các chiến thuật đang hiển thị
// của 1 map) vào đúng những vị trí mà nhóm đó đang chiếm trong danh sách
// đầy đủ — các chiến thuật thuộc map khác giữ nguyên vị trí, không bị xáo.
function applySubsetOrder(fullList, newOrderOfSubset) {
  const ids = new Set(newOrderOfSubset.map((t) => t.id));
  const indices = [];
  fullList.forEach((t, i) => { if (ids.has(t.id)) indices.push(i); });
  const next = [...fullList];
  indices.forEach((idx, i) => { next[idx] = newOrderOfSubset[i]; });
  return next;
}

function getVideoList(a) {
  if (Array.isArray(a.videoUrls) && a.videoUrls.length) return a.videoUrls;
  if (a.videoUrl) return [{ id: a.id + "_v0", url: a.videoUrl }];
  return [];
}

function normalizeImage(img) {
  if (typeof img === "string") return { id: img, src: img, caption: "" };
  return { id: img.id || img.src, src: img.src, caption: img.caption || "" };
}

function getAssignmentImages(a, tactic, isFirst) {
  if (Array.isArray(a.images) && a.images.length) return a.images.map(normalizeImage);
  if (isFirst && tactic.images?.length) return tactic.images.map(normalizeImage);
  return [];
}

// Trong bản web (khi window.storage.uploadImage tồn tại), ảnh/video được
// tải lên một nơi lưu trữ riêng (Cloudinary) thay vì nhúng thẳng base64
// vào dữ liệu — tránh làm phình dữ liệu và chạm giới hạn dung lượng mỗi
// bản ghi của database. Ở các bản khác (Windows, bản gốc trong Claude)
// không có hàm này, nên sẽ tự động giữ nguyên cách cũ (lưu thẳng base64).
async function hostImage(dataUrl) {
  if (typeof window !== "undefined" && window.storage?.uploadImage) {
    try {
      const hosted = await window.storage.uploadImage(dataUrl);
      if (hosted) return hosted;
    } catch {}
  }
  return dataUrl;
}

function compressImage(file, maxDim = 1920) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const isPng = file.type === "image/png";
        const localDataUrl = isPng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85);
        resolve(hostImage(localDataUrl));
      };
      img.onerror = () => reject(new Error("image decode failed"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}

function FontStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');

      .tac-root { font-family: 'Inter', sans-serif; background: #0E1117; color: #E8EAED; }
      .tac-root * { box-sizing: border-box; }
      .tac-display { font-family: 'Oswald', sans-serif; letter-spacing: 0.02em; }
      .tac-mono { font-family: 'JetBrains Mono', monospace; }

      .tac-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
      .tac-scroll::-webkit-scrollbar-track { background: transparent; }
      .tac-scroll::-webkit-scrollbar-thumb { background: #2A3340; border-radius: 4px; }

      .tac-mapbtn { transition: all .15s ease; }
      .tac-mapbtn:hover { background: #1B232E !important; }

      .tac-card { transition: border-color .15s ease, transform .15s ease; }
      .tac-card:hover { border-color: #3A4555 !important; }

      .tac-thumb { transition: transform .15s ease, border-color .15s ease; }
      .tac-thumb:hover { transform: scale(1.08); border-color: #5B9BD5 !important; z-index: 2; position: relative; }

      .tac-hover-pop { animation: tacHoverPop .12s ease; transform-origin: left center; }
      @keyframes tacHoverPop { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }

      .tac-iconbtn { transition: background .15s ease, color .15s ease; }
      .tac-iconbtn:hover { background: #232B36; }

      .tac-fade-in { animation: tacFadeIn .25s ease; }
      @keyframes tacFadeIn { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: translateY(0);} }
      @keyframes spin { to { transform: rotate(360deg);} }

      .tac-chip { transition: all .15s ease; cursor: pointer; }

      .tac-input::placeholder { color: #5C6573; }
      .tac-input:focus, .tac-textarea:focus { outline: none; border-color: #5B9BD5 !important; }

      @media (prefers-reduced-motion: reduce) {
        .tac-fade-in, .tac-mapbtn, .tac-card, .tac-iconbtn { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}

/* ---------------------------------------------------------
   STORAGE HOOK
--------------------------------------------------------- */
function useTacticsStore() {
  const [maps, setMaps] = useState(DEFAULT_MAPS);
  const [tactics, setTactics] = useState([]);
  const [mapImages, setMapImages] = useState({});
  const [mapCallouts, setMapCallouts] = useState({}); // { [mapName]: [{id,x,y,label}] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let loadedMaps = DEFAULT_MAPS;
        let loadedTactics = [];
        let loadedImages = {};
        let loadedCallouts = {};
        try {
          const m = await window.storage.get("cs2-tactics-maps", true);
          if (m?.value) loadedMaps = JSON.parse(m.value);
        } catch {}
        try {
          const t = await window.storage.get("cs2-tactics-data", true);
          if (t?.value) loadedTactics = JSON.parse(t.value);
        } catch {}
        try {
          const im = await window.storage.get("cs2-tactics-map-images", true);
          if (im?.value) loadedImages = JSON.parse(im.value);
        } catch {}
        try {
          const co = await window.storage.get("cs2-tactics-callouts", true);
          if (co?.value) loadedCallouts = JSON.parse(co.value);
        } catch {}
        if (!cancelled) {
          setMaps(loadedMaps);
          setTactics(loadedTactics);
          setMapImages(loadedImages);
          setMapCallouts(loadedCallouts);
        }
      } catch (e) {
        if (!cancelled) setError("Không thể tải dữ liệu. Thử tải lại trang.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const persistMaps = useCallback(async (next) => {
    setMaps(next);
    try { await window.storage.set("cs2-tactics-maps", JSON.stringify(next), true); } catch {}
  }, []);

  const persistTactics = useCallback(async (next) => {
    setTactics(next);
    try { await window.storage.set("cs2-tactics-data", JSON.stringify(next), true); } catch {}
  }, []);

  const persistMapImages = useCallback(async (next) => {
    setMapImages(next);
    try { await window.storage.set("cs2-tactics-map-images", JSON.stringify(next), true); } catch {}
  }, []);

  const persistMapCallouts = useCallback(async (next) => {
    setMapCallouts(next);
    try { await window.storage.set("cs2-tactics-callouts", JSON.stringify(next), true); } catch {}
  }, []);

  return {
    maps, tactics, mapImages, mapCallouts, loading, error,
    persistMaps, persistTactics, persistMapImages, persistMapCallouts,
  };
}

/* ---------------------------------------------------------
   MAIN APP
--------------------------------------------------------- */
export default function TacticsBoard() {
  const {
    maps, tactics, mapImages, mapCallouts, loading, error,
    persistMaps, persistTactics, persistMapImages, persistMapCallouts,
  } = useTacticsStore();
  const [selectedMap, setSelectedMap] = useState(null);
  const [sideFilter, setSideFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // tactic object or null
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [newMapName, setNewMapName] = useState("");
  const [addingMap, setAddingMap] = useState(false);
  const [editingMapImage, setEditingMapImage] = useState(false);
  const [mapImageDraft, setMapImageDraft] = useState("");
  const [mapImageError, setMapImageError] = useState("");
  // Map nhiều tầng (vd: Nuke): id của tầng đang sửa ảnh / đang xem trên
  // "Bản đồ Nade". null = map 1 tầng kiểu cũ, không cần quan tâm tầng.
  const [mapFloorEditing, setMapFloorEditing] = useState(null);
  const [activeFloor, setActiveFloor] = useState(null);
  const [newFloorLabel, setNewFloorLabel] = useState("");
  const [renamingFloorId, setRenamingFloorId] = useState(null);
  const [renamingFloorText, setRenamingFloorText] = useState("");
  const mapImageFileRef = useRef(null);
  const importFileRef = useRef(null);
  const [importPending, setImportPending] = useState(null); // parsed data waiting confirmation
  const [importError, setImportError] = useState("");
  const [tipCopied, setTipCopied] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(() => new Set()); // rỗng = hiện tất cả
  const [highlightTacticId, setHighlightTacticId] = useState(null);
  const [highlightAssignmentId, setHighlightAssignmentId] = useState(null);
  const [calloutsEnabled, setCalloutsEnabled] = useState(false);

  const RADAR_TIP_CMD = 'bind CAPSLOCK "incrementvar cl_radar_scale 0 1 0.5"';
  const handleCopyTip = () => {
    const done = () => { setTipCopied(true); setTimeout(() => setTipCopied(false), 1500); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(RADAR_TIP_CMD).then(done).catch(() => {});
    }
  };

  useEffect(() => {
    if (!selectedMap && maps.length) setSelectedMap(maps[0]);
  }, [maps, selectedMap]);

  useEffect(() => {
    setEditingMapImage(false);
    setMapImageDraft("");
    setMapImageError("");
    setCategoryFilter(new Set());
    setMapFloorEditing(null);
    setActiveFloor(null);
    setNewFloorLabel("");
  }, [selectedMap]);

  // Danh sách tầng của map đang chọn — chuẩn hoá cả map 1 tầng (chuỗi) lẫn
  // map nhiều tầng (mảng) về cùng 1 dạng để dùng chung.
  const floors = useMemo(() => getFloors(mapImages, selectedMap), [mapImages, selectedMap]);
  const isMultiFloor = Array.isArray(mapImages[selectedMap]);
  useEffect(() => {
    if (floors.length && !floors.some((f) => f.id === activeFloor)) setActiveFloor(floors[0].id);
  }, [floors, activeFloor]);
  const activeFloorObj = floors.find((f) => f.id === activeFloor) || floors[0] || null;

  // Map Nuke có 2 tầng (giống csnades.gg/nuke) — tự tạo sẵn 2 tầng rỗng
  // ngay lần đầu người dùng mở map Nuke, nếu map đó chưa có dữ liệu ảnh gì.
  // Chỉ chạy sau khi dữ liệu ban đầu đã tải xong (loading === false) để
  // không vô tình ghi đè dữ liệu Nuke thật đang được tải.
  useEffect(() => {
    if (loading) return;
    if (selectedMap !== "Nuke") return;
    if (mapImages["Nuke"] !== undefined) return;
    persistMapImages({
      ...mapImages,
      Nuke: [
        { id: "f1", label: "Tầng 1", url: "" },
        { id: "f2", label: "Tầng 2", url: "" },
      ],
    });
  }, [loading, selectedMap, mapImages, persistMapImages]);

  const handleSaveMapImage = async () => {
    const raw = mapImageDraft.trim();
    if (!raw) { setEditingMapImage(false); return; }
    const url = raw.startsWith("data:") ? await hostImage(raw) : raw;
    let next;
    if (isMultiFloor) {
      const floorId = mapFloorEditing || floors[0]?.id;
      next = { ...mapImages, [selectedMap]: floors.map((f) => (f.id === floorId ? { ...f, url } : f)) };
    } else {
      next = { ...mapImages, [selectedMap]: url };
    }
    await persistMapImages(next);
    setEditingMapImage(false);
    setMapImageDraft("");
    setMapImageError("");
  };

  const handleRemoveMapImage = async () => {
    if (isMultiFloor) {
      const floorId = mapFloorEditing || floors[0]?.id;
      await persistMapImages({ ...mapImages, [selectedMap]: floors.map((f) => (f.id === floorId ? { ...f, url: "" } : f)) });
      return;
    }
    const next = { ...mapImages };
    delete next[selectedMap];
    await persistMapImages(next);
  };

  // Bật chế độ nhiều tầng cho map đang chọn (vd: Nuke) — giữ nguyên ảnh
  // hiện có (nếu có) làm "Tầng 1", rồi thêm sẵn 1 "Tầng 2" trống để sửa ảnh.
  const handleEnableMultiFloor = async () => {
    const existingUrl = typeof mapImages[selectedMap] === "string" ? mapImages[selectedMap] : "";
    const next = {
      ...mapImages,
      [selectedMap]: [
        { id: "f1", label: "Tầng 1", url: existingUrl },
        { id: "f2", label: "Tầng 2", url: "" },
      ],
    };
    await persistMapImages(next);
    setMapFloorEditing("f2");
    setActiveFloor("f1");
  };

  const handleAddFloor = async () => {
    const label = newFloorLabel.trim() || `Tầng ${floors.length + 1}`;
    const newId = uid();
    const next = { ...mapImages, [selectedMap]: [...floors, { id: newId, label, url: "" }] };
    await persistMapImages(next);
    setNewFloorLabel("");
    setMapFloorEditing(newId);
    setMapImageDraft("");
    setMapImageError("");
    setEditingMapImage(true);
  };

  const handleRemoveFloor = async (floorId) => {
    if (floors.length <= 1) return; // luôn giữ tối thiểu 1 tầng
    const next = floors.filter((f) => f.id !== floorId);
    await persistMapImages({ ...mapImages, [selectedMap]: next });
    if (activeFloor === floorId) setActiveFloor(next[0]?.id || null);
    if (mapFloorEditing === floorId) setMapFloorEditing(null);
  };

  const handleRenameFloor = async (floorId, label) => {
    const text = (label || "").trim();
    if (!text) return;
    const next = floors.map((f) => (f.id === floorId ? { ...f, label: text } : f));
    await persistMapImages({ ...mapImages, [selectedMap]: next });
  };

  const handleMapImageFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMapImageError("Vui lòng chọn một file ảnh (jpg, png, webp...).");
      return;
    }
    if (file.size > 4.5 * 1024 * 1024) {
      setMapImageError("Ảnh quá lớn (tối đa khoảng 4MB). Hãy chọn ảnh nhẹ hơn hoặc dùng link ảnh.");
      return;
    }
    setMapImageError("");
    const reader = new FileReader();
    reader.onload = () => setMapImageDraft(reader.result);
    reader.onerror = () => setMapImageError("Không đọc được file ảnh, thử lại nhé.");
    reader.readAsDataURL(file);
  };

  const mapTactics = useMemo(() => {
    let list = tactics.filter((t) => t.map === selectedMap);
    if (sideFilter !== "ALL") list = list.filter((t) => t.side === sideFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) =>
        t.name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.assignments?.some((a) => a.role?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [tactics, selectedMap, sideFilter, query]);

  // Gắn sẵn danh sách loại nade (smoke/molotov/flash/combination) cho từng
  // chiến thuật đang hiển thị, dùng chung cho cả panel đếm số lượng, bộ lọc
  // theo loại, và chế độ "Bản đồ Nade".
  const categorizedMapTactics = useMemo(
    () => mapTactics.map((t) => ({ ...t, _categories: classifyTactic(t) })),
    [mapTactics]
  );

  const categoryCounts = useMemo(() => {
    const c = { smoke: 0, molotov: 0, flash: 0, grenade: 0, combination: 0 };
    categorizedMapTactics.forEach((t) => { t._categories.forEach((cat) => { c[cat] = (c[cat] || 0) + 1; }); });
    return c;
  }, [categorizedMapTactics]);

  const visibleTactics = useMemo(() => {
    if (categoryFilter.size === 0) return categorizedMapTactics;
    return categorizedMapTactics.filter((t) => t._categories.some((c) => categoryFilter.has(c)));
  }, [categorizedMapTactics, categoryFilter]);

  const toggleCategoryFilter = (key) => {
    setCategoryFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Nhảy từ "Bản đồ Nade" về đúng dòng chiến thuật (và đúng role, nếu biết)
  // tương ứng trong bảng: cuộn tới dòng đó và highlight tạm thời.
  const handleJumpToTactic = (tacticId, assignmentId) => {
    let targetId;
    if (assignmentId) {
      targetId = `assign-row-${assignmentId}`;
    } else {
      const t = tactics.find((x) => x.id === tacticId);
      const firstReal = t?.assignments?.[0]?.id;
      targetId = firstReal ? `assign-row-${firstReal}` : `tactic-row-${tacticId}`;
    }
    setHighlightTacticId(tacticId);
    setHighlightAssignmentId(assignmentId || null);
    setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    setTimeout(() => { setHighlightTacticId(null); setHighlightAssignmentId(null); }, 2600);
  };

  // Map nhiều tầng (vd: Nuke) cần callout RIÊNG cho từng tầng (tên khu vực
  // ở tầng trên khác hẳn tầng dưới) — nên callout được lưu theo khoá
  // "map" (map 1 tầng, không đổi so với trước) hoặc "map__floorId" (map
  // nhiều tầng, theo đúng tầng đang xem).
  const calloutMapKey = isMultiFloor && activeFloor ? `${selectedMap}__${activeFloor}` : selectedMap;

  // label đã được nhập qua ô nhập liệu trong NadeMapView (không dùng
  // window.prompt — một số môi trường hiển thị (webview nhúng, bản xem
  // trước…) chặn hộp thoại prompt() của trình duyệt khiến nó không hiện
  // ra gì cả và không thêm được callout).
  const handleAddCallout = async (x, y, label) => {
    const text = (label || "").trim();
    if (!text) return;
    // Nếu map này chưa có callout tự lưu, bắt đầu từ bộ callout mặc định
    // (nếu có) rồi mới thêm điểm mới — để callout mặc định không bị mất.
    const list = mapCallouts[calloutMapKey] !== undefined
      ? mapCallouts[calloutMapKey]
      : (DEFAULT_CALLOUTS[calloutMapKey] || []);
    const next = { ...mapCallouts, [calloutMapKey]: [...list, { id: uid(), x, y, label: text }] };
    await persistMapCallouts(next);
  };

  const handleRemoveCallout = async (id) => {
    const list = mapCallouts[calloutMapKey] !== undefined
      ? mapCallouts[calloutMapKey]
      : (DEFAULT_CALLOUTS[calloutMapKey] || []);
    const next = { ...mapCallouts, [calloutMapKey]: list.filter((c) => c.id !== id) };
    await persistMapCallouts(next);
  };

  const handleRenameCallout = async (id, label) => {
    const text = (label || "").trim();
    if (!text) return;
    const list = mapCallouts[calloutMapKey] !== undefined
      ? mapCallouts[calloutMapKey]
      : (DEFAULT_CALLOUTS[calloutMapKey] || []);
    const next = { ...mapCallouts, [calloutMapKey]: list.map((c) => (c.id === id ? { ...c, label: text } : c)) };
    await persistMapCallouts(next);
  };

  // Kéo-thả: cập nhật toạ độ % của 1 callout sau khi người dùng thả chuột.
  const handleMoveCallout = async (id, x, y) => {
    const list = mapCallouts[calloutMapKey] !== undefined
      ? mapCallouts[calloutMapKey]
      : (DEFAULT_CALLOUTS[calloutMapKey] || []);
    const next = { ...mapCallouts, [calloutMapKey]: list.map((c) => (c.id === id ? { ...c, x, y } : c)) };
    await persistMapCallouts(next);
  };

  // Xoay chữ của 1 callout: đổi qua lại giữa nằm NGANG (0°) và nằm DỌC
  // (90°) — giống các tên khu vực dài (vd "Long", "Catwalk") trên radar
  // gốc thường được xoay dọc để nằm vừa theo hành lang hẹp.
  // Xoay tự do 1 callout (giữ chuột trái rồi kéo quanh tâm) — lưu số độ
  // chính xác thay vì chỉ 2 trạng thái ngang/dọc.
  const handleRotateCallout = async (id, rotation) => {
    const list = mapCallouts[calloutMapKey] !== undefined
      ? mapCallouts[calloutMapKey]
      : (DEFAULT_CALLOUTS[calloutMapKey] || []);
    const next = { ...mapCallouts, [calloutMapKey]: list.map((c) => (c.id === id ? { ...c, rotation } : c)) };
    await persistMapCallouts(next);
  };

  // Phóng to / thu nhỏ riêng 1 callout (kéo núm nhỏ ở góc).
  const handleResizeCallout = async (id, scale) => {
    const list = mapCallouts[calloutMapKey] !== undefined
      ? mapCallouts[calloutMapKey]
      : (DEFAULT_CALLOUTS[calloutMapKey] || []);
    const next = { ...mapCallouts, [calloutMapKey]: list.map((c) => (c.id === id ? { ...c, scale } : c)) };
    await persistMapCallouts(next);
  };

  const countsByMap = useMemo(() => {
    const c = {};
    tactics.forEach((t) => { c[t.map] = (c[t.map] || 0) + 1; });
    return c;
  }, [tactics]);

  const handleSave = async (tactic) => {
    let next;
    if (tactic.id && tactics.some((t) => t.id === tactic.id)) {
      next = tactics.map((t) => (t.id === tactic.id ? tactic : t));
    } else {
      next = [...tactics, { ...tactic, id: uid() }];
    }
    await persistTactics(next);
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    await persistTactics(tactics.filter((t) => t.id !== id));
    setConfirmDelete(null);
  };

  // Kéo thả: thả chiến thuật "dragId" vào đúng vị trí của "targetId"
  // trong danh sách đang hiển thị (đã lọc theo map/side/tìm kiếm).
  const handleReorderTactic = async (dragId, targetId) => {
    if (!dragId || !targetId || dragId === targetId) return;
    const fromIdx = mapTactics.findIndex((t) => t.id === dragId);
    const toIdx = mapTactics.findIndex((t) => t.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...mapTactics];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    await persistTactics(applySubsetOrder(tactics, reordered));
  };

  // Tích chọn ghim nhiều dòng: các dòng được tích sẽ dồn lên đầu, theo
  // đúng thứ tự người dùng tích (tích trước lên trước, tích sau lên sau);
  // những dòng không tích giữ nguyên thứ tự tương đối với nhau ở phía sau.
  //
  // `baseOrderIds` là thứ tự gốc (chụp lại ngay trước khi tích dòng đầu
  // tiên trong một "đợt" ghim) — luôn dùng thứ tự gốc này để tính toán,
  // thay vì thứ tự hiện tại (đã bị xáo bởi các lần ghim trước đó), để khi
  // bỏ tích hết, danh sách quay lại đúng y vị trí ban đầu chứ không bị kẹt.
  const handleApplyPinOrder = async (pinnedIds, baseOrderIds) => {
    const source = baseOrderIds
      ? baseOrderIds.map((id) => mapTactics.find((t) => t.id === id)).filter(Boolean)
      : mapTactics;
    if (pinnedIds.length === 0) {
      // Bỏ tích hết: khôi phục nguyên trạng thứ tự gốc.
      await persistTactics(applySubsetOrder(tactics, source));
      return;
    }
    const pinnedSet = new Set(pinnedIds);
    const pinned = pinnedIds.map((id) => source.find((t) => t.id === id)).filter(Boolean);
    const rest = source.filter((t) => !pinnedSet.has(t.id));
    const reordered = [...pinned, ...rest];
    await persistTactics(applySubsetOrder(tactics, reordered));
  };

  const handleAddMap = async () => {
    const name = newMapName.trim();
    if (!name || maps.includes(name)) { setAddingMap(false); setNewMapName(""); return; }
    const next = [...maps, name];
    await persistMaps(next);
    setSelectedMap(name);
    setNewMapName("");
    setAddingMap(false);
  };

  const handleExportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      maps,
      tactics,
      mapImages,
      mapCallouts,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cs2-tactics-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const triggerImport = () => {
    setImportError("");
    importFileRef.current?.click();
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.tactics) || !Array.isArray(data.maps)) {
          setImportError("File không đúng định dạng dữ liệu CS2 Tactics Board.");
          return;
        }
        setImportPending(data);
      } catch (err) {
        setImportError("Không đọc được file JSON, kiểm tra lại file nhé.");
      }
    };
    reader.onerror = () => setImportError("Không đọc được file, thử lại nhé.");
    reader.readAsText(file);
  };

  const confirmImport = async (mode = "replace") => {
    if (!importPending) return;
    const incomingMaps = importPending.maps || [];
    const incomingTactics = importPending.tactics || [];
    const incomingMapImages = importPending.mapImages || {};
    const incomingMapCallouts = importPending.mapCallouts || {};

    if (mode === "merge") {
      // Add without wiping out what's already here: keep every existing
      // map/tactic/map-image as-is, and only bring in items from the file
      // whose id/name isn't already present. Importing several backup
      // files one after another this way keeps combining them instead of
      // each one erasing what the previous import added.
      const nextMaps = [...maps];
      incomingMaps.forEach((m) => { if (!nextMaps.includes(m)) nextMaps.push(m); });

      const existingIds = new Set(tactics.map((t) => t.id));
      const nextTactics = [...tactics];
      incomingTactics.forEach((t) => {
        if (!t.id || !existingIds.has(t.id)) {
          const id = t.id && !existingIds.has(t.id) ? t.id : uid();
          existingIds.add(id);
          nextTactics.push({ ...t, id });
        }
      });

      const nextMapImages = { ...incomingMapImages, ...mapImages };
      const nextMapCallouts = { ...mapCallouts };
      Object.keys(incomingMapCallouts).forEach((m) => {
        const existingList = nextMapCallouts[m] || [];
        const existingIds = new Set(existingList.map((c) => c.id));
        const merged = [...existingList];
        (incomingMapCallouts[m] || []).forEach((c) => {
          if (!c.id || !existingIds.has(c.id)) merged.push({ ...c, id: c.id && !existingIds.has(c.id) ? c.id : uid() });
        });
        nextMapCallouts[m] = merged;
      });

      await persistMaps(nextMaps);
      await persistTactics(nextTactics);
      await persistMapImages(nextMapImages);
      await persistMapCallouts(nextMapCallouts);
      setImportPending(null);
      if (!selectedMap && nextMaps[0]) setSelectedMap(nextMaps[0]);
    } else {
      await persistMaps(incomingMaps);
      await persistTactics(incomingTactics);
      await persistMapImages(incomingMapImages);
      await persistMapCallouts(incomingMapCallouts);
      setImportPending(null);
      setSelectedMap(incomingMaps[0] || null);
    }
  };

  if (loading) {
    return (
      <div className="tac-root" style={{ minHeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "#5B9BD5" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg);} }`}</style>
          <div className="tac-mono" style={{ fontSize: 13, color: "#8A93A3" }}>ĐANG TẢI DỮ LIỆU…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tac-root" style={{ minHeight: 600, display: "flex", borderRadius: 12, overflow: "hidden", border: "1px solid #2A3340" }}>
      <FontStyles />

      {error && (
        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", background: "#E2574C", color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 13, zIndex: 50 }}>
          {error}
        </div>
      )}

      {/* SIDEBAR */}
      <div style={{ width: 230, flexShrink: 0, background: "#141A22", borderRight: "1px solid #2A3340", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 16px 10px" }}>
          <div className="tac-display" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, color: "#fff" }}>
            TACTIC<span style={{ color: "#5B9BD5" }}>BOARD</span>
          </div>
          <div className="tac-mono" style={{ fontSize: 10, color: "#5C6573", marginTop: 4, letterSpacing: "0.08em" }}>
            CS2 · CHIẾN THUẬT THEO MAP
          </div>
        </div>

        <div className="tac-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
          {/* Loại nade — danh sách dọc kiểu csnades.gg */}
          <div style={{ margin: "2px 2px 14px" }}>
            <div className="tac-mono" style={{ fontSize: 10.5, color: "#5C6573", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>
              Loại nade
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {CATEGORY_ORDER.map((key) => {
                const meta = CATEGORY_META[key];
                const Icon = meta.icon;
                const active = categoryFilter.has(key);
                const count = categoryCounts[key] || 0;
                return (
                  <button
                    key={key}
                    onClick={() => toggleCategoryFilter(key)}
                    className="tac-chip"
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "7px 9px",
                      borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left",
                      background: active ? "#1B232E" : "transparent",
                      borderLeft: `3px solid ${active ? meta.color : "transparent"}`,
                    }}
                  >
                    <span style={{
                      flexShrink: 0, width: 24, height: 24, borderRadius: "50%", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      background: `radial-gradient(circle at 35% 30%, ${meta.color}DD, ${meta.color}33 65%, #11161D 100%)`,
                      border: `1.5px solid ${meta.color}`,
                      boxShadow: "inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.4)",
                    }}>
                      <Icon size={12} style={{ color: "#0E1117" }} />
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: active ? "#fff" : "#B6BCC6" }}>{meta.label}</span>
                    <span className="tac-mono" style={{ fontSize: 11, color: active ? meta.color : "#5C6573" }}>{count}</span>
                  </button>
                );
              })}
            </div>
            {categoryFilter.size > 0 && (
              <button
                onClick={() => setCategoryFilter(new Set())}
                className="tac-iconbtn"
                style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, padding: "6px 9px", borderRadius: 8, border: "1px dashed #2A3340", background: "transparent", color: "#5C6573", cursor: "pointer", fontSize: 11.5 }}
              >
                <X size={11} /> Bỏ lọc loại nade
              </button>
            )}
          </div>

          {/* Bên — Any / CT / T */}
          <div style={{ margin: "0 2px 16px" }}>
            <div className="tac-mono" style={{ fontSize: 10.5, color: "#5C6573", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>
              Bên
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["ALL", "CT", "T"].map((s) => {
                const meta = SIDE_META[s];
                const Icon = s === "ALL" ? Users : meta.icon;
                const color = s === "ALL" ? "#8A93A3" : meta.color;
                const active = sideFilter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setSideFilter(s)}
                    className="tac-chip"
                    style={{
                      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "8px 4px 6px",
                      borderRadius: 8, cursor: "pointer", fontSize: 10.5, fontWeight: 600,
                      border: "none", background: "transparent",
                      color: active ? color : "#8A93A3",
                    }}
                  >
                    {/* Huy hiệu tròn tự thiết kế (gradient + viền nổi khối) —
                        không dùng icon chính thức của game, chỉ lấy cảm hứng
                        bố cục "huy hiệu phe" cho đẹp mắt hơn. */}
                    <span style={{
                      width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: active
                        ? `radial-gradient(circle at 35% 30%, ${color}EE, ${color}55 60%, #11161D 100%)`
                        : "radial-gradient(circle at 35% 30%, #2A3340, #1B232E 70%, #11161D 100%)",
                      border: `2px solid ${active ? color : "#2A3340"}`,
                      boxShadow: active
                        ? `0 0 0 3px ${color}22, inset 0 1px 2px rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.45)`
                        : "inset 0 1px 2px rgba(255,255,255,0.05), inset 0 -2px 4px rgba(0,0,0,0.5)",
                    }}>
                      <Icon size={15} style={{ color: active ? "#0E1117" : "#5C6573", filter: active ? "drop-shadow(0 1px 0 rgba(255,255,255,0.25))" : "none" }} />
                    </span>
                    {s === "ALL" ? "Any" : s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tac-mono" style={{ fontSize: 10.5, color: "#5C6573", letterSpacing: "0.1em", margin: "0 2px 8px", textTransform: "uppercase" }}>
            Maps
          </div>
          {maps.map((m) => {
            const active = m === selectedMap;
            return (
              <button
                key={m}
                onClick={() => setSelectedMap(m)}
                className="tac-mapbtn"
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", marginBottom: 4, borderRadius: 8, border: "none",
                  background: active ? "#1B232E" : "transparent",
                  borderLeft: active ? "3px solid #5B9BD5" : "3px solid transparent",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <Crosshair size={14} style={{ color: active ? "#5B9BD5" : "#5C6573", flexShrink: 0 }} />
                <span className="tac-display" style={{ fontSize: 14, color: active ? "#fff" : "#B6BCC6", flex: 1 }}>
                  {m}
                </span>
                {!!countsByMap[m] && (
                  <span className="tac-mono" style={{ fontSize: 10, color: "#5C6573" }}>{countsByMap[m]}</span>
                )}
              </button>
            );
          })}

          {addingMap ? (
            <div style={{ display: "flex", gap: 6, padding: "6px 4px" }}>
              <input
                autoFocus
                className="tac-input"
                value={newMapName}
                onChange={(e) => setNewMapName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddMap(); if (e.key === "Escape") { setAddingMap(false); setNewMapName(""); } }}
                placeholder="Tên map…"
                style={{ flex: 1, background: "#0E1117", border: "1px solid #2A3340", borderRadius: 6, color: "#E8EAED", fontSize: 13, padding: "6px 8px" }}
              />
              <button onClick={handleAddMap} className="tac-iconbtn" style={{ background: "#1B232E", border: "1px solid #2A3340", borderRadius: 6, padding: "0 8px", color: "#6FCF97", cursor: "pointer" }}>
                <Save size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingMap(true)}
              className="tac-iconbtn"
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", marginTop: 2, borderRadius: 8, border: "1px dashed #2A3340", background: "transparent", color: "#5C6573", cursor: "pointer", fontSize: 13 }}
            >
              <Plus size={14} /> Thêm map
            </button>
          )}

          {/* Mẹo pro */}
          <div
            style={{
              margin: "14px 2px 4px",
              padding: "12px 12px 11px",
              borderRadius: 10,
              border: "1px solid #2A3340",
              background: "linear-gradient(160deg, #1B232E 0%, #141A22 100%)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Zap size={13} style={{ color: "#E0A458" }} />
              <span
                className="tac-display"
                style={{ fontSize: 10.5, fontWeight: 700, color: "#E0A458", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                Mẹo pro
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#B6BCC6", lineHeight: 1.5, marginBottom: 9 }}>
              Zoom in/out radar nhanh — gán phím <span style={{ color: "#E8EAED", fontWeight: 600 }}>CapsLock</span>:
            </div>
            <div style={{ position: "relative" }}>
              <code
                className="tac-mono"
                style={{
                  display: "block", fontSize: 10.5, color: "#6FCF97", background: "#0E1117",
                  border: "1px solid #2A3340", borderRadius: 6, padding: "8px 28px 8px 9px",
                  lineHeight: 1.6, wordBreak: "break-all",
                }}
              >
                {RADAR_TIP_CMD}
              </code>
              <button
                onClick={handleCopyTip}
                title="Sao chép lệnh"
                className="tac-iconbtn"
                style={{
                  position: "absolute", top: 6, right: 6, background: "transparent", border: "none",
                  color: tipCopied ? "#6FCF97" : "#5C6573", cursor: "pointer", padding: 3, display: "flex",
                }}
              >
                {tipCopied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: "10px", borderTop: "1px solid #2A3340", display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={handleExportData}
            className="tac-iconbtn"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid #2A3340", background: "transparent", color: "#B6BCC6", cursor: "pointer", fontSize: 12.5 }}
          >
            <Download size={14} /> Xuất dữ liệu
          </button>
          <button
            onClick={triggerImport}
            className="tac-iconbtn"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid #2A3340", background: "transparent", color: "#B6BCC6", cursor: "pointer", fontSize: 12.5 }}
          >
            <Upload size={14} /> Nhập dữ liệu
          </button>
          <input ref={importFileRef} type="file" accept="application/json,.json" onChange={handleImportFile} style={{ display: "none" }} />
          {importError && <div style={{ fontSize: 11, color: "#E2574C" }}>{importError}</div>}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0E1117", minWidth: 0 }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid #2A3340" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div className="tac-mono" style={{ fontSize: 11, color: "#5C6573", letterSpacing: "0.1em", marginBottom: 2 }}>
                [ MAP ĐANG CHỌN ]
              </div>
              <div className="tac-display" style={{ fontSize: 30, fontWeight: 700, color: "#fff", textTransform: "uppercase" }}>
                {selectedMap || "—"}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => { setEditing(null); setFormOpen(true); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, background: "#5B9BD5", color: "#0E1117",
                  border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 600, fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <Plus size={16} /> Thêm chiến thuật
              </button>
            </div>
          </div>

          {/* Map callout image — map nhiều tầng (vd: Nuke) có thêm tab chọn
              tầng đang sửa ảnh; map 1 tầng giữ nguyên giao diện cũ. */}
          <div style={{ marginTop: 14 }}>
            {isMultiFloor && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                {floors.map((f) => (
                  renamingFloorId === f.id ? (
                    <input
                      key={f.id}
                      autoFocus
                      className="tac-input"
                      value={renamingFloorText}
                      onChange={(e) => setRenamingFloorText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { handleRenameFloor(f.id, renamingFloorText); setRenamingFloorId(null); }
                        if (e.key === "Escape") setRenamingFloorId(null);
                      }}
                      onBlur={() => { handleRenameFloor(f.id, renamingFloorText); setRenamingFloorId(null); }}
                      style={{ background: "#141A22", border: "1px solid #5B9BD5", borderRadius: 7, color: "#E8EAED", fontSize: 12, padding: "6px 9px", width: 120 }}
                    />
                  ) : (
                    <button
                      key={f.id}
                      onClick={() => { setMapFloorEditing(f.id); setMapImageDraft(f.url || ""); setMapImageError(""); setEditingMapImage(true); }}
                      onDoubleClick={(e) => { e.stopPropagation(); setRenamingFloorId(f.id); setRenamingFloorText(f.label || ""); }}
                      title="Bấm để chọn/sửa ảnh — bấm đúp để đổi tên tầng"
                      className="tac-chip"
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 7, fontSize: 12, cursor: "pointer",
                        border: `1px solid ${mapFloorEditing === f.id ? "#5B9BD5" : "#2A3340"}`,
                        background: mapFloorEditing === f.id ? "#5B9BD522" : "#161B22",
                        color: mapFloorEditing === f.id ? "#5B9BD5" : "#B6BCC6",
                      }}
                    >
                      <Layers size={12} />
                      {f.label || "Tầng"}
                      {!f.url && <span style={{ color: "#5C6573", fontSize: 10.5 }}>(chưa có ảnh)</span>}
                      {floors.length > 1 && (
                        <X
                          size={12}
                          onClick={(e) => { e.stopPropagation(); handleRemoveFloor(f.id); }}
                          style={{ marginLeft: 2 }}
                        />
                      )}
                    </button>
                  )
                ))}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    className="tac-input"
                    value={newFloorLabel}
                    onChange={(e) => setNewFloorLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddFloor(); }}
                    placeholder={`Tên tầng mới (vd: Tầng ${floors.length + 1})`}
                    style={{ background: "#141A22", border: "1px solid #2A3340", borderRadius: 7, color: "#E8EAED", fontSize: 12, padding: "6px 9px", width: 160 }}
                  />
                  <button
                    onClick={handleAddFloor}
                    className="tac-chip"
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 7, fontSize: 12, color: "#5B9BD5", background: "transparent", border: "1px dashed #2A3340", cursor: "pointer" }}
                  >
                    <Plus size={12} /> Thêm tầng
                  </button>
                </div>
              </div>
            )}

            {editingMapImage ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 460 }}>
                {mapImageDraft && (
                  <div className="tac-fade-in" style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #2A3340", background: "#000" }}>
                    <img src={mapImageDraft} alt="Xem trước" style={{ display: "block", maxHeight: 160, width: "100%", objectFit: "contain" }} />
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    autoFocus
                    className="tac-input"
                    value={mapImageDraft}
                    onChange={(e) => setMapImageDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveMapImage(); if (e.key === "Escape") setEditingMapImage(false); }}
                    placeholder={isMultiFloor ? `Dán link ảnh radar cho ${floors.find((f) => f.id === mapFloorEditing)?.label || "tầng này"}…` : "Dán link ảnh radar / callout của map…"}
                    style={{ flex: 1, background: "#141A22", border: "1px solid #2A3340", borderRadius: 8, color: "#E8EAED", fontSize: 13, padding: "9px 12px" }}
                  />
                  <input
                    ref={mapImageFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMapImageFile}
                    style={{ display: "none" }}
                  />
                  <button
                    onClick={() => mapImageFileRef.current?.click()}
                    className="tac-iconbtn"
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "#1B232E", border: "1px solid #2A3340", borderRadius: 8, padding: "9px 12px", color: "#E8EAED", cursor: "pointer", fontSize: 13, flexShrink: 0, whiteSpace: "nowrap" }}
                  >
                    <ImageIcon size={14} /> Tải ảnh lên
                  </button>
                </div>
                {mapImageError && (
                  <div style={{ fontSize: 12, color: "#E2574C" }}>{mapImageError}</div>
                )}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => setEditingMapImage(false)} style={{ background: "transparent", border: "1px solid #2A3340", borderRadius: 8, padding: "9px 14px", color: "#8A93A3", cursor: "pointer", fontSize: 13 }}>
                    Hủy
                  </button>
                  <button onClick={handleSaveMapImage} style={{ display: "flex", alignItems: "center", gap: 6, background: "#5B9BD5", color: "#0E1117", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    <Save size={13} /> Lưu
                  </button>
                </div>
              </div>
            ) : activeFloorObj?.url ? (
              // Ảnh sơ đồ giờ hiển thị to, căn giữa, ngay trong khu vực "Bản
              // đồ Nade" bên dưới — ở đây chỉ còn 2 nút gọn để sửa/xoá ảnh
              // (của đúng tầng đang chọn, nếu map có nhiều tầng).
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => { setMapFloorEditing(activeFloorObj.id); setMapImageDraft(activeFloorObj.url); setMapImageError(""); setEditingMapImage(true); }}
                  className="tac-iconbtn"
                  style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #2A3340", background: "transparent", color: "#B6BCC6", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12.5 }}
                >
                  <Pencil size={13} /> Sửa ảnh {isMultiFloor ? activeFloorObj.label : "bản đồ"}
                </button>
                <button
                  onClick={handleRemoveMapImage}
                  className="tac-iconbtn"
                  style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #2A3340", background: "transparent", color: "#E2574C", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12.5 }}
                >
                  <Trash2 size={13} /> Xoá ảnh
                </button>
                {!isMultiFloor && (
                  <button
                    onClick={handleEnableMultiFloor}
                    className="tac-iconbtn"
                    title="Dùng cho các map có nhiều tầng như Nuke, Vertigo…"
                    style={{ display: "flex", alignItems: "center", gap: 6, border: "1px dashed #2A3340", background: "transparent", color: "#5C6573", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12.5 }}
                  >
                    <Layers size={13} /> Map này có nhiều tầng?
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => { setMapFloorEditing(activeFloorObj?.id || null); setMapImageDraft(""); setMapImageError(""); setEditingMapImage(true); }}
                  className="tac-iconbtn"
                  style={{ display: "flex", alignItems: "center", gap: 8, border: "1px dashed #2A3340", background: "transparent", color: "#5C6573", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontSize: 13 }}
                >
                  <ImageIcon size={15} /> Thêm ảnh sơ đồ / callout cho {isMultiFloor ? `${selectedMap} — ${activeFloorObj?.label}` : selectedMap}
                </button>
                {!isMultiFloor && (
                  <button
                    onClick={handleEnableMultiFloor}
                    className="tac-iconbtn"
                    title="Dùng cho các map có nhiều tầng như Nuke, Vertigo…"
                    style={{ display: "flex", alignItems: "center", gap: 6, border: "1px dashed #2A3340", background: "transparent", color: "#5C6573", borderRadius: 8, padding: "10px 12px", cursor: "pointer", fontSize: 12.5 }}
                  >
                    <Layers size={13} /> Map này có nhiều tầng?
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#141A22", border: "1px solid #2A3340", borderRadius: 8, padding: "7px 12px", flex: "1 1 220px" }}>
              <Search size={14} style={{ color: "#5C6573" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên, mô tả, role…"
                className="tac-input"
                style={{ flex: 1, background: "transparent", border: "none", color: "#E8EAED", fontSize: 13 }}
              />
            </div>
            {(sideFilter !== "ALL" || categoryFilter.size > 0) && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {sideFilter !== "ALL" && (
                  <span className="tac-mono" style={{ fontSize: 11, padding: "6px 10px", borderRadius: 7, border: `1px solid ${SIDE_META[sideFilter].color}`, color: SIDE_META[sideFilter].color, background: `${SIDE_META[sideFilter].color}1A` }}>
                    Bên: {sideFilter}
                  </span>
                )}
                {[...categoryFilter].map((key) => (
                  <span key={key} className="tac-mono" style={{ fontSize: 11, padding: "6px 10px", borderRadius: 7, border: `1px solid ${CATEGORY_META[key].color}`, color: CATEGORY_META[key].color, background: `${CATEGORY_META[key].color}1A` }}>
                    {CATEGORY_META[key].label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table / Bản đồ Nade */}
        <div className="tac-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
          {/* Bản đồ Nade luôn hiển thị trước tiên */}
          <NadeMapView
            tactics={visibleTactics}
            mapImageUrl={activeFloorObj?.url || ""}
            floors={floors}
            activeFloorId={activeFloorObj?.id || null}
            onChangeFloor={setActiveFloor}
            callouts={mapCallouts[calloutMapKey] !== undefined ? mapCallouts[calloutMapKey] : (DEFAULT_CALLOUTS[calloutMapKey] || [])}
            calloutsEnabled={calloutsEnabled}
            onToggleCallouts={() => setCalloutsEnabled((v) => !v)}
            onAddCallout={handleAddCallout}
            onRemoveCallout={handleRemoveCallout}
            onMoveCallout={handleMoveCallout}
            onRenameCallout={handleRenameCallout}
            onRotateCallout={handleRotateCallout}
            onResizeCallout={handleResizeCallout}
            onJumpToTactic={handleJumpToTactic}
            onEditTactic={(t) => { setEditing(t); setFormOpen(true); }}
          />

          {/* Bảng chiến thuật hiển thị ngay bên dưới */}
          <div style={{ padding: "0 24px 32px" }}>
            {visibleTactics.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", color: "#5C6573" }}>
                <MapPin size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
                <div className="tac-display" style={{ fontSize: 16, color: "#8A93A3" }}>
                  {mapTactics.length === 0 ? "Chưa có chiến thuật nào" : "Không có chiến thuật nào khớp bộ lọc"}
                </div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {mapTactics.length === 0
                    ? `Bấm "Thêm chiến thuật" để bắt đầu xây dựng tactic cho ${selectedMap}.`
                    : "Thử bỏ bớt bộ lọc loại nade ở trên."}
                </div>
              </div>
            ) : (
              <TacticsTable
                tactics={visibleTactics}
                highlightId={highlightTacticId}
                highlightAssignmentId={highlightAssignmentId}
                onEdit={(t) => { setEditing(t); setFormOpen(true); }}
                onDelete={(t) => setConfirmDelete(t)}
                onImage={(url) => setLightbox(url)}
                onReorder={handleReorderTactic}
                onApplyPinOrder={handleApplyPinOrder}
              />
            )}
          </div>
        </div>
      </div>

      {formOpen && (
        <TacticForm
          initial={editing}
          map={selectedMap}
          mapFloors={floors}
          allTacticsOnMap={categorizedMapTactics}
          onCancel={() => { setFormOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Xóa chiến thuật?"
          message={`"${confirmDelete.name || "Chiến thuật này"}" sẽ bị xóa vĩnh viễn.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete.id)}
        />
      )}

      {importPending && (
        <ConfirmDialog
          title="Nhập dữ liệu?"
          message={`File có ${importPending.tactics.length} chiến thuật. Chọn "Gộp / Thêm mới" để thêm vào dữ liệu hiện tại (${tactics.length} chiến thuật) mà không xóa gì cả — dùng cách này nếu bạn nhập nhiều file backup liên tiếp. Chọn "Thay thế toàn bộ" nếu muốn xóa hết dữ liệu hiện tại và dùng đúng dữ liệu trong file.`}
          onCancel={() => setImportPending(null)}
          extraLabel="Gộp / Thêm mới"
          onExtra={() => confirmImport("merge")}
          extraColor="#6FCF97"
          confirmLabel="Thay thế toàn bộ"
          confirmColor="#E2574C"
          onConfirm={() => confirmImport("replace")}
        />
      )}

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24, cursor: "zoom-out", gap: 12 }}
        >
          <img
            src={typeof lightbox === "string" ? lightbox : lightbox.src}
            alt=""
            style={{ maxWidth: "90%", maxHeight: "82vh", borderRadius: 8, border: "1px solid #2A3340" }}
          />
          {typeof lightbox !== "string" && lightbox.caption && (
            <div className="tac-root" style={{ color: "#E8EAED", fontSize: 14, background: "rgba(20,26,34,0.9)", padding: "8px 16px", borderRadius: 8, maxWidth: "80%", textAlign: "center" }}>
              {lightbox.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   TACTICS TABLE (layout ngang kiểu spreadsheet)
--------------------------------------------------------- */
function TacticsTable({ tactics, onEdit, onDelete, onImage, onReorder, onApplyPinOrder, highlightId, highlightAssignmentId }) {
  const thStyle = {
    background: "#1E3FE0", color: "#fff", fontSize: 12.5, fontWeight: 700,
    textAlign: "left", padding: "10px 12px", position: "sticky", top: 0, zIndex: 2,
    whiteSpace: "nowrap", letterSpacing: "0.02em",
  };
  const cols = [
    { key: "order", label: "", width: 40 },
    { key: "stt", label: "STT", width: 50 },
    { key: "side", label: "CT/T", width: 64 },
    { key: "name", label: "Tatic", width: 160 },
    { key: "desc", label: "Mô tả", width: 280 },
    { key: "role", label: "Role", width: 160 },
    { key: "video", label: "Video hướng dẫn ném đồ", width: 280 },
    { key: "image", label: "Hình ảnh", width: 220 },
    { key: "actions", label: "", width: 70 },
  ];

  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [pinnedOrder, setPinnedOrder] = useState([]); // ids theo đúng thứ tự đã tích chọn
  // Thứ tự các dòng NGAY TRƯỚC khi bắt đầu tích dòng đầu tiên của một đợt
  // ghim — dùng để khôi phục lại đúng vị trí ban đầu khi bỏ tích hết.
  const baseOrderRef = useRef(null);

  const handleDragStart = (id) => (e) => {
    setDragId(id);
    try {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
    } catch {}
  };
  const handleDragOverRow = (id) => (e) => {
    e.preventDefault();
    if (dragId && id !== dragId && overId !== id) setOverId(id);
  };
  const handleDropRow = (id) => (e) => {
    e.preventDefault();
    if (dragId && dragId !== id) onReorder?.(dragId, id);
    setDragId(null);
    setOverId(null);
  };
  const handleDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };
  const handlePinToggle = (id, checked) => {
    setPinnedOrder((prev) => {
      // Bắt đầu một đợt ghim mới (chưa có dòng nào được tích) → chụp lại
      // thứ tự hiện tại làm "gốc" để có thể khôi phục sau này.
      if (checked && prev.length === 0) {
        baseOrderRef.current = tactics.map((t) => t.id);
      }
      const next = checked
        ? (prev.includes(id) ? prev : [...prev, id])
        : prev.filter((x) => x !== id);
      onApplyPinOrder?.(next, baseOrderRef.current);
      if (next.length === 0) {
        // Đã bỏ tích hết — đợt ghim kết thúc, xoá mốc gốc để đợt sau chụp lại.
        baseOrderRef.current = null;
      }
      return next;
    });
  };

  return (
    <table className="tac-mono" style={{ borderCollapse: "collapse", width: "100%", minWidth: 1140, fontFamily: "'Inter', sans-serif" }}>
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c.key} style={{ ...thStyle, width: c.width, borderRight: "1px solid #3653F0" }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tactics.map((t, idx) => (
          <TacticRows
            key={t.id}
            index={idx + 1}
            tactic={t}
            onEdit={() => onEdit(t)}
            onDelete={() => onDelete(t)}
            onImage={onImage}
            isDragOver={overId === t.id}
            onDragStart={handleDragStart(t.id)}
            onDragOverRow={handleDragOverRow(t.id)}
            onDropRow={handleDropRow(t.id)}
            onDragEnd={handleDragEnd}
            isPinned={pinnedOrder.includes(t.id)}
            pinRank={pinnedOrder.length > 1 ? pinnedOrder.indexOf(t.id) + 1 : 0}
            onPinToggle={(checked) => handlePinToggle(t.id, checked)}
            isHighlighted={highlightId === t.id}
            highlightAssignmentId={highlightId === t.id ? highlightAssignmentId : null}
          />
        ))}
      </tbody>
    </table>
  );
}

function TacticRows({
  index, tactic, onEdit, onDelete, onImage,
  isDragOver, onDragStart, onDragOverRow, onDropRow, onDragEnd, isPinned, pinRank, onPinToggle,
  isHighlighted, highlightAssignmentId,
}) {
  const meta = SIDE_META[tactic.side] || SIDE_META.CT;
  const Icon = meta.icon;
  const [openVideos, setOpenVideos] = useState({});
  const [hoverPreview, setHoverPreview] = useState(null); // {src, caption, x, y}
  const assignments = tactic.assignments?.length ? tactic.assignments : [{ id: "_empty", role: "", videoUrls: [], note: "" }];
  const rowSpan = assignments.length;
  const tdBase = { border: "1px solid #232B36", padding: "10px 12px", fontSize: 13, color: "#E8EAED", verticalAlign: "top" };
  const toggleVideo = (id) => setOpenVideos((prev) => ({ ...prev, [id]: !prev[id] }));

  const showPreview = (img) => (e) => {
    setHoverPreview({ src: img.src, caption: img.caption, x: e.clientX, y: e.clientY });
  };
  const movePreview = (e) => {
    setHoverPreview((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev));
  };
  const hidePreview = () => setHoverPreview(null);

  // Cho phép kéo thả bắt đầu từ bất kỳ đâu trong dòng, nhưng nếu người
  // dùng đang bấm vào một phần tử có thể tương tác (nút, link, checkbox,
  // ảnh thu nhỏ...) thì hủy việc kéo để không chặn mất cú click bình thường.
  const handleRowDragStart = (e) => {
    if (e.target.closest("button, input, a, .tac-thumb")) {
      e.preventDefault();
      return;
    }
    onDragStart(e);
  };

  return (
    <>
      {assignments.map((a, i) => {
        const videos = getVideoList(a);
        // Mỗi dòng (ứng với 1 role) có id riêng để "Bản đồ Nade" có thể
        // nhảy thẳng tới đúng role, vì 1 chiến thuật có thể có nhiều role
        // ném các loại nade khác nhau từ các vị trí khác nhau.
        const rowId = a.id === "_empty" ? `tactic-row-${tactic.id}` : `assign-row-${a.id}`;
        const isRowHighlighted = isHighlighted && (!highlightAssignmentId || highlightAssignmentId === a.id);
        return (
          <tr
            key={a.id}
            id={rowId}
            className="tac-fade-in"
            draggable
            onDragStart={handleRowDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOverRow}
            onDrop={onDropRow}
            title="Kéo dòng này để đổi thứ tự"
            style={{
              background: isRowHighlighted ? "#2A3F22" : (i % 2 === 0 ? "#141A22" : "#10151C"),
              boxShadow: isRowHighlighted ? "inset 0 0 0 2px #6FCF97" : (isDragOver ? "inset 0 2px 0 0 #5B9BD5" : "none"),
              transition: "background 0.4s ease",
              cursor: "grab",
            }}
          >
            {i === 0 && (
              <td
                rowSpan={rowSpan}
                style={{ ...tdBase, textAlign: "center", background: isPinned ? "#1F3A2C" : "#161B22" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <input
                    type="checkbox"
                    checked={!!isPinned}
                    onChange={(e) => onPinToggle?.(e.target.checked)}
                    title="Tích để đưa dòng này lên đầu — tích nhiều dòng theo thứ tự mong muốn"
                    style={{ cursor: "pointer", width: 16, height: 16, accentColor: "#6FCF97" }}
                  />
                  {pinRank > 0 && (
                    <span
                      title={`Thứ tự ghim: ${pinRank}`}
                      style={{
                        fontSize: 10, fontWeight: 700, color: "#6FCF97", background: "#6FCF9722",
                        borderRadius: 4, padding: "1px 5px", lineHeight: 1.4,
                      }}
                    >
                      {pinRank}
                    </span>
                  )}
                </div>
              </td>
            )}
            {i === 0 && (
              <td rowSpan={rowSpan} style={{ ...tdBase, textAlign: "center", fontWeight: 700, color: "#fff", background: "#161B22" }}>
                {index}
              </td>
            )}
            {i === 0 && (
              <td rowSpan={rowSpan} style={{ ...tdBase, background: "#161B22" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${meta.color}22`, color: meta.color, padding: "3px 8px", borderRadius: 5, fontSize: 11.5, fontWeight: 700 }}>
                  <Icon size={12} /> {meta.label}
                </span>
              </td>
            )}
            {i === 0 && (
              <td rowSpan={rowSpan} style={{ ...tdBase, fontWeight: 600, background: "#161B22" }} className="tac-display">
                {tactic.name || "(Chưa đặt tên)"}
              </td>
            )}
            {i === 0 && (
              <td rowSpan={rowSpan} style={{ ...tdBase, color: "#B6BCC6", lineHeight: 1.6, whiteSpace: "pre-wrap", background: "#161B22" }}>
                {tactic.description || "—"}
                {tactic.descImages?.length > 0 && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                    {tactic.descImages.map(normalizeImage).map((img, k) => (
                      <div key={img.id || k} style={{ width: 84, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <button
                          onClick={() => onImage(img)}
                          onMouseEnter={showPreview(img)}
                          onMouseMove={movePreview}
                          onMouseLeave={hidePreview}
                          className="tac-thumb"
                          style={{ border: "1px solid #2A3340", borderRadius: 6, padding: 0, background: "none", cursor: "zoom-in", overflow: "hidden", width: 84, height: 52, flexShrink: 0 }}
                        >
                          <img src={img.src} alt={img.caption || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </button>
                        {img.caption && (
                          <span style={{ fontSize: 10.5, color: "#9BA3AF", textAlign: "center", lineHeight: 1.35, wordBreak: "break-word" }}>
                            {img.caption}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </td>
            )}

            <td style={tdBase}>{a.role || "—"}</td>

            <td style={tdBase}>
              {videos.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {videos.map((v, vi) => {
                    const yt = v.fileData ? null : parseYoutube(v.url);
                    const isOpen = openVideos[v.id];
                    return (
                      <div key={v.id} style={{ paddingTop: vi > 0 ? 6 : 0, borderTop: vi > 0 ? "1px solid #232B36" : "none" }}>
                        {v.desc && <div style={{ fontSize: 12.5, color: "#E8EAED", marginBottom: 3 }}>{v.desc}</div>}
                        <button
                          onClick={() => toggleVideo(v.id)}
                          className="tac-chip"
                          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#5B9BD5", background: "transparent", border: "none", padding: 0, textAlign: "left" }}
                        >
                          <Play size={12} /> {v.desc ? "Xem video" : (videos.length > 1 ? `Video ${vi + 1}` : "Xem video")}
                          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                        {isOpen && v.fileData && (
                          <div className="tac-fade-in" style={{ marginTop: 8, borderRadius: 6, overflow: "hidden", width: "100%", maxWidth: 260, background: "#000" }}>
                            <video src={v.fileData} controls style={{ width: "100%", display: "block" }} />
                          </div>
                        )}
                        {isOpen && !v.fileData && yt && (
                          <div className="tac-fade-in" style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                              onClick={() => window.open(v.url, "_blank")}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5,
                                color: "#0E1117", background: "#5B9BD5", border: "none", borderRadius: 6,
                                padding: "6px 10px", cursor: "pointer", fontWeight: 600,
                              }}
                            >
                              <Play size={12} /> Mở video (tại {formatTimestamp(yt.start)})
                            </button>
                          </div>
                        )}
                        {isOpen && !v.fileData && !yt && v.url && (
                          <a href={v.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#5B9BD5", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <Link2 size={11} /> Mở liên kết video
                          </a>
                        )}
                      </div>
                    );
                  })}
                  {a.note && <div style={{ fontSize: 12, color: "#8A93A3" }}>{a.note}</div>}
                </div>
              ) : a.note ? (
                <div style={{ fontSize: 12, color: "#8A93A3" }}>{a.note}</div>
              ) : (
                <span style={{ color: "#5C6573" }}>—</span>
              )}
            </td>

            <td style={tdBase}>
              {(() => {
                const imgs = getAssignmentImages(a, tactic, i === 0);
                return imgs.length > 0 ? (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {imgs.map((img, k) => (
                      <div key={img.id || k} style={{ width: 84, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <button
                          onClick={() => onImage(img)}
                          onMouseEnter={showPreview(img)}
                          onMouseMove={movePreview}
                          onMouseLeave={hidePreview}
                          className="tac-thumb"
                          style={{ border: "1px solid #2A3340", borderRadius: 6, padding: 0, background: "none", cursor: "zoom-in", overflow: "hidden", width: 84, height: 52, flexShrink: 0 }}
                        >
                          <img src={img.src} alt={img.caption || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </button>
                        {img.caption && (
                          <span style={{ fontSize: 10.5, color: "#9BA3AF", textAlign: "center", lineHeight: 1.35, wordBreak: "break-word" }}>
                            {img.caption}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: "#5C6573" }}>—</span>
                );
              })()}
            </td>

            {i === 0 && (
              <td rowSpan={rowSpan} style={{ ...tdBase, background: "#161B22" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={onEdit} className="tac-iconbtn" style={{ background: "transparent", border: "1px solid #2A3340", borderRadius: 6, padding: 6, color: "#8A93A3", cursor: "pointer" }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={onDelete} className="tac-iconbtn" style={{ background: "transparent", border: "1px solid #2A3340", borderRadius: 6, padding: 6, color: "#E2574C", cursor: "pointer" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            )}
          </tr>
        );
      })}

      {hoverPreview && (
        <ImageHoverPreview preview={hoverPreview} />
      )}
    </>
  );
}

function ImageHoverPreview({ preview }) {
  const size = 320;
  const margin = 16;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  let left = preview.x + margin;
  let top = preview.y - size / 2;
  if (left + size > vw - 8) left = preview.x - size - margin;
  if (left < 8) left = 8;
  if (top + size + 50 > vh - 8) top = vh - size - 58;
  if (top < 8) top = 8;

  return (
    <tr>
      <td colSpan={8} style={{ border: "none", padding: 0, height: 0 }}>
        <div
          className="tac-root tac-hover-pop"
          style={{
            position: "fixed", left, top, width: size, zIndex: 200, pointerEvents: "none",
            background: "#161B22", border: "1px solid #5B9BD5", borderRadius: 12, overflow: "hidden",
            boxShadow: "0 18px 48px rgba(0,0,0,0.6)",
          }}
        >
          <img src={preview.src} alt="" style={{ width: "100%", display: "block", maxHeight: 280, objectFit: "contain", background: "#000" }} />
          {preview.caption && (
            <div style={{ padding: "9px 12px", fontSize: 12.5, color: "#E8EAED", lineHeight: 1.45, borderTop: "1px solid #232B36" }}>{preview.caption}</div>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ---------------------------------------------------------
   BẢN ĐỒ NADE — ghim các chiến thuật đã có vị trí lên ảnh sơ đồ, gom
   theo điểm rơi, bấm vào để xem popup kiểu "điểm ném → điểm rơi" và
   nhảy thẳng tới dòng tương ứng trong bảng.
--------------------------------------------------------- */
function NadeMapView({
  tactics, mapImageUrl, floors, activeFloorId, onChangeFloor, callouts, calloutsEnabled, onToggleCallouts,
  onAddCallout, onRemoveCallout, onMoveCallout, onRenameCallout, onRotateCallout, onResizeCallout, onJumpToTactic, onEditTactic,
}) {
  const isMultiFloor = (floors || []).length > 1;
  const [activeSpot, setActiveSpot] = useState(null); // cluster object | null
  const [calloutPicking, setCalloutPicking] = useState(false);
  const mapImgRef = useRef(null);
  // Kéo-thả callout: toạ độ % hiện tại trong lúc kéo (ghi đè callouts[].x/y
  // chỉ để vẽ — vị trí thật chỉ được lưu khi thả chuột ra).
  const [dragState, setDragState] = useState(null); // { id, x, y }
  // Giữ chuột trái (không di chuyển) trong 1 khoảng ngắn trên 1 callout →
  // chuyển sang CHẾ ĐỘ XOAY: kéo quanh tâm để xoay chữ tự do (thay vì kéo
  // để di chuyển như bình thường). Click-kéo ngay (không giữ) vẫn là di
  // chuyển như cũ.
  const [rotatingId, setRotatingId] = useState(null);
  const [rotateDraft, setRotateDraft] = useState(null); // { id, rotation }
  // Kéo núm nhỏ ở góc callout để phóng to/thu nhỏ riêng callout đó.
  const [resizeDraft, setResizeDraft] = useState(null); // { id, scale }
  // Ô nhập tên khi vừa đặt 1 điểm callout mới (không dùng window.prompt —
  // bị một số môi trường hiển thị chặn, khiến "Thêm callout" không có tác
  // dụng gì khi bấm vào bản đồ).
  const [pendingPoint, setPendingPoint] = useState(null); // { x, y }
  // Menu chuột phải trên 1 callout đã có: "Đổi tên" / "Xoá".
  const [contextMenu, setContextMenu] = useState(null); // { id, x, y }
  // Đang sửa tên 1 callout đã có (mở từ menu chuột phải → "Đổi tên").
  const [renameTarget, setRenameTarget] = useState(null); // { id, x, y, label }
  const [editorText, setEditorText] = useState("");

  // Đóng menu chuột phải khi bấm ra ngoài.
  useEffect(() => {
    if (!contextMenu) return;
    const onDocMouseDown = (e) => {
      if (!e.target.closest || !e.target.closest("[data-callout-menu]")) setContextMenu(null);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [contextMenu]);

  // Vị trí giờ đặt THEO TỪNG ROLE (assignment) chứ không phải theo cả chiến
  // thuật — vì 1 chiến thuật có thể có nhiều role, mỗi người ném 1 loại
  // nade khác nhau từ 1 chỗ khác nhau. Trải phẳng tactics × assignments
  // thành danh sách điểm, mỗi điểm = 1 role đã đặt vị trí.
  const placed = useMemo(() => {
    const pts = [];
    tactics.forEach((t) => {
      // Map nhiều tầng (vd: Nuke): chỉ hiện điểm thuộc ĐÚNG tầng đang xem.
      // Map 1 tầng: bỏ qua floorId hoàn toàn (dữ liệu cũ không có field
      // này) để không ảnh hưởng tới các map hiện có.
      const roleAssignments = (t.assignments || []).filter(
        (a) => a.landAt && (!isMultiFloor || (a.floorId || floors[0]?.id) === activeFloorId)
      );
      if (roleAssignments.length) {
        roleAssignments.forEach((a) => {
          pts.push({
            id: a.id,
            tacticId: t.id,
            assignmentId: a.id,
            name: a.role ? `${t.name} — ${a.role}` : t.name,
            landAt: a.landAt,
            throwFrom: a.throwFrom || null,
            _categories: classifyAssignment(t, a),
          });
        });
      } else if (t.landAt) {
        // Dữ liệu cũ (trước khi có vị trí theo từng role): vị trí được lưu
        // ở cấp chiến thuật — vẫn hiển thị như 1 điểm duy nhất.
        pts.push({
          id: t.id,
          tacticId: t.id,
          assignmentId: null,
          name: t.name,
          landAt: t.landAt,
          throwFrom: t.throwFrom || null,
          _categories: t._categories,
        });
      }
    });
    return pts;
  }, [tactics]);

  // Gom các điểm (role) rơi gần nhau (trong vòng ~2.5%) thành 1 ghim duy
  // nhất trên bản đồ, giống cách csnades.gg nhóm nhiều biến thể của cùng
  // 1 quả nade vào 1 điểm.
  // Gom theo VỊ TRÍ + LOẠI NADE (không gộp chung mọi loại vào 1 ghim nữa) —
  // giống csnades.gg: 2 loại nade khác nhau ném cùng 1 chỗ sẽ ra 2 "bông
  // hoa" đếm số riêng, cạnh nhau, thay vì 1 ghim pha trộn.
  const spots = useMemo(() => {
    const GRID = 2.5;
    const groups = new Map();
    placed.forEach((p) => {
      const cats = p._categories.filter((c) => c !== "combination");
      const cat = cats[0] || "khac";
      const key = `${cat}_${Math.round(p.landAt.x / GRID)}_${Math.round(p.landAt.y / GRID)}`;
      if (!groups.has(key)) groups.set(key, { category: cat, items: [] });
      groups.get(key).items.push(p);
    });
    return [...groups.values()].map((g) => {
      const items = g.items;
      const x = items.reduce((s, p) => s + p.landAt.x, 0) / items.length;
      const y = items.reduce((s, p) => s + p.landAt.y, 0) / items.length;
      const categoriesUnion = new Set([g.category]);
      return { id: `${g.category}|${items.map((p) => p.id).join("|")}`, x, y, items, categoriesUnion, category: g.category };
    });
  }, [placed]);

  const clientToPercent = (clientX, clientY) => {
    const rect = mapImgRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  const handleMapClick = (e) => {
    if (calloutPicking) {
      const { x, y } = clientToPercent(e.clientX, e.clientY);
      setContextMenu(null);
      setRenameTarget(null);
      setEditorText("");
      setPendingPoint({ x, y });
      setCalloutPicking(false);
      return;
    }
    // Bấm vào chỗ trống trên bản đồ (không trúng ghim nào) → đóng overlay
    // điểm ném/đường kẻ đang mở, nếu có.
    if (activeSpot) setActiveSpot(null);
  };

  // Bắt đầu kéo 1 callout đã có. Chỉ cho kéo khi KHÔNG ở chế độ "đặt callout
  // mới", để tránh xung đột thao tác. Chuột trái (không kéo) giờ không làm
  // gì cả — xoá/đổi tên chỉ thực hiện qua menu chuột phải.
  // Giữ chuột trái ~350ms mà KHÔNG di chuyển → vào chế độ xoay; nếu di
  // chuyển ngay (trước khi giữ đủ lâu) → vẫn là kéo-để-di-chuyển như cũ.
  //
  // LƯU Ý quan trọng (lỗi đã sửa): ngưỡng "coi là đã bắt đầu kéo" trong lúc
  // đang giữ chờ xoay KHÔNG được quá nhỏ — tay người cầm chuột giữ yên vẫn
  // tự nhiên rung/lệch vài pixel trong 300-400ms, nên nếu ngưỡng chỉ 4px
  // thì hầu như lần giữ nào cũng bị tính nhầm thành "kéo di chuyển" trước
  // khi bộ đếm giờ xoay kịp chạy → không bao giờ vào được chế độ xoay.
  // Giờ dùng 2 ngưỡng tách biệt: rung nhẹ trong lúc giữ (<= HOLD_JITTER_PX)
  // không huỷ xoay; chỉ một cú kéo rõ ràng, nhanh (> DRAG_CANCEL_PX ngay từ
  // đầu, trước khi đủ thời gian giữ) mới chuyển thẳng sang di chuyển.
  const ROTATE_HOLD_MS = 320;
  const HOLD_JITTER_PX = 6;
  const DRAG_CANCEL_PX = 16;
  const handleCalloutMouseDown = (e, callout) => {
    if (calloutPicking || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    let mode = null; // null (chưa quyết định) | "move" | "rotate"
    const startX = e.clientX;
    const startY = e.clientY;

    const getCenterPx = () => {
      const rect = mapImgRef.current.getBoundingClientRect();
      return { cx: rect.left + (callout.x / 100) * rect.width, cy: rect.top + (callout.y / 100) * rect.height };
    };

    const startRotate = () => {
      mode = "rotate";
      clearTimeout(holdTimer);
      setDragState(null);
      setRotatingId(callout.id);
      setRotateDraft({ id: callout.id, rotation: callout.rotation || 0 });
    };

    const holdTimer = setTimeout(() => {
      if (mode === null) startRotate();
    }, ROTATE_HOLD_MS);

    const onMove = (ev) => {
      const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
      if (mode === "rotate") {
        const { cx, cy } = getCenterPx();
        const angle = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
        setRotateDraft({ id: callout.id, rotation: Math.round(angle) });
        return;
      }
      if (mode === null) {
        if (dist > DRAG_CANCEL_PX) {
          // Kéo rõ ràng, nhanh ngay từ đầu → chuyển hẳn sang di chuyển.
          mode = "move";
          clearTimeout(holdTimer);
          setDragState({ id: callout.id, x: callout.x, y: callout.y });
        } else if (dist > HOLD_JITTER_PX) {
          // Lệch hơn mức rung tay bình thường nhưng chưa tới ngưỡng kéo
          // hẳn — vẫn coi là đang giữ chờ xoay, chỉ cập nhật preview vị
          // trí (chưa commit di chuyển).
          return;
        }
        return;
      }
      if (mode === "move") {
        const { x, y } = clientToPercent(ev.clientX, ev.clientY);
        setDragState({ id: callout.id, x, y });
      }
    };
    const onUp = (ev) => {
      clearTimeout(holdTimer);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (mode === "rotate") {
        setRotatingId(null);
        setRotateDraft((cur) => {
          if (cur && cur.id === callout.id) onRotateCallout(callout.id, cur.rotation);
          return null;
        });
        return;
      }
      if (mode === "move") {
        const { x, y } = clientToPercent(ev.clientX, ev.clientY);
        setDragState(null);
        onMoveCallout(callout.id, x, y);
      }
      // mode === null: nhả chuột ra trước khi đủ thời gian giữ và không kéo
      // đủ xa → chỉ là 1 cú click thường, không làm gì cả.
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // Kéo núm nhỏ ở góc 1 callout để phóng to/thu nhỏ riêng callout đó —
  // tỉ lệ dựa theo khoảng cách từ tâm callout tới con trỏ chuột.
  const handleResizeMouseDown = (e, callout) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = mapImgRef.current.getBoundingClientRect();
    const centerX = rect.left + (callout.x / 100) * rect.width;
    const centerY = rect.top + (callout.y / 100) * rect.height;
    const startDist = Math.hypot(e.clientX - centerX, e.clientY - centerY) || 1;
    const startScale = callout.scale || 1;

    const onMove = (ev) => {
      const dist = Math.hypot(ev.clientX - centerX, ev.clientY - centerY);
      const nextScale = Math.min(3, Math.max(0.5, +((startScale * dist) / startDist).toFixed(2)));
      setResizeDraft({ id: callout.id, scale: nextScale });
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setResizeDraft((cur) => {
        if (cur && cur.id === callout.id) onResizeCallout(callout.id, cur.scale);
        return null;
      });
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const handleCalloutContextMenu = (e, callout) => {
    e.preventDefault();
    e.stopPropagation();
    if (calloutPicking) return;
    setContextMenu({ id: callout.id, x: callout.x, y: callout.y });
  };

  const openRename = (callout) => {
    setContextMenu(null);
    setEditorText(callout.label);
    setRenameTarget({ id: callout.id, x: callout.x, y: callout.y });
  };

  const confirmEditor = () => {
    const text = editorText.trim();
    if (!text) { cancelEditor(); return; }
    if (renameTarget) onRenameCallout(renameTarget.id, text);
    else if (pendingPoint) onAddCallout(pendingPoint.x, pendingPoint.y, text);
    cancelEditor();
  };

  const cancelEditor = () => {
    setPendingPoint(null);
    setRenameTarget(null);
    setEditorText("");
  };

  if (!mapImageUrl) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", color: "#5C6573" }}>
        {isMultiFloor && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {floors.map((f) => (
              <button
                key={f.id}
                onClick={() => onChangeFloor(f.id)}
                className="tac-chip"
                style={{
                  padding: "6px 14px", borderRadius: 7, fontSize: 12.5, cursor: "pointer",
                  border: `1px solid ${activeFloorId === f.id ? "#5B9BD5" : "#2A3340"}`,
                  background: activeFloorId === f.id ? "#5B9BD522" : "#141A22",
                  color: activeFloorId === f.id ? "#5B9BD5" : "#B6BCC6",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
        <MapIcon size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
        <div className="tac-display" style={{ fontSize: 16, color: "#8A93A3" }}>
          {isMultiFloor ? `Tầng này (${floors.find((f) => f.id === activeFloorId)?.label || ""}) chưa có ảnh sơ đồ` : "Map này chưa có ảnh sơ đồ"}
        </div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Thêm ảnh sơ đồ ở đầu trang để dùng được Bản đồ Nade.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", display: "inline-block", maxWidth: "100%", borderRadius: 10, overflow: "hidden", border: "1px solid #2A3340", background: "#000" }}>
        <img
          ref={mapImgRef}
          src={mapImageUrl}
          alt=""
          onClick={handleMapClick}
          style={{ display: "block", maxWidth: "100%", maxHeight: "72vh", objectFit: "contain", cursor: calloutPicking ? "crosshair" : "default" }}
        />

        {/* Tab chọn tầng (vd: Nuke có tầng trên/tầng dưới) — xếp dọc ở góc
            trên-phải giống csnades.gg. Chỉ hiện khi map có từ 2 tầng trở lên. */}
        {isMultiFloor && (
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", flexDirection: "column", gap: 6, zIndex: 6 }}>
            {floors.map((f) => (
              <button
                key={f.id}
                onClick={(e) => { e.stopPropagation(); onChangeFloor(f.id); }}
                title={f.label}
                className="tac-mono"
                style={{
                  width: 30, height: 30, borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 700,
                  border: `1px solid ${activeFloorId === f.id ? "#5B9BD5" : "rgba(255,255,255,0.15)"}`,
                  background: activeFloorId === f.id ? "#5B9BD5" : "rgba(14,17,23,0.75)",
                  color: activeFloorId === f.id ? "#0E1117" : "#E8EAED",
                }}
              >
                {f.label?.match(/\d+/)?.[0] || f.label?.[0] || "?"}
              </button>
            ))}
          </div>
        )}

        {calloutsEnabled && callouts.map((c) => {
          const isDragging = dragState && dragState.id === c.id;
          const isRotating = rotatingId === c.id && rotateDraft;
          const isResizing = resizeDraft && resizeDraft.id === c.id;
          const pos = isDragging ? dragState : c;
          const rotation = isRotating ? rotateDraft.rotation : (c.rotation || 0);
          const scale = isResizing ? resizeDraft.scale : (c.scale || 1);
          const active = isDragging || isRotating || isResizing;
          return (
            <div
              key={c.id}
              onMouseDown={(e) => handleCalloutMouseDown(e, c)}
              onContextMenu={(e) => handleCalloutContextMenu(e, c)}
              title="Kéo để di chuyển — giữ chuột rồi kéo để xoay — bấm chuột phải để đổi tên / xoá"
              className="tac-mono"
              style={{
                position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`,
                transform: `translate(-50%,-50%) rotate(${rotation}deg) scale(${scale})`,
                fontSize: 10.5, color: "#E8EAED", background: active ? "rgba(91,155,213,0.85)" : "rgba(14,17,23,0.78)",
                border: `1px solid ${active ? "#5B9BD5" : "#3A4456"}`,
                borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap", cursor: calloutPicking ? "default" : "grab",
                // Khi đang ở chế độ "Thêm callout", tắt pointer-events trên các
                // nhãn đã có để click luôn xuyên qua tới ảnh bản đồ bên dưới —
                // nếu không, bấm gần như ở đâu cũng trúng 1 nhãn có sẵn thay vì
                // đặt điểm mới.
                pointerEvents: calloutPicking ? "none" : "auto",
                userSelect: "none", zIndex: active ? 5 : 1,
              }}
            >
              {c.label}
              {/* Núm nhỏ ở góc dưới-phải — kéo để phóng to/thu nhỏ riêng callout này */}
              {!calloutPicking && (
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, c)}
                  title="Kéo để phóng to / thu nhỏ"
                  style={{
                    position: "absolute", right: -5, bottom: -5, width: 9, height: 9, borderRadius: "50%",
                    background: "#5B9BD5", border: "1px solid #0E1117", cursor: "nwse-resize",
                  }}
                />
              )}
            </div>
          );
        })}

        {spots.map((spot) => {
          const meta = CATEGORY_META[spot.category] || { label: "Khác", color: "#8A93A3", icon: MapPin };
          const count = spot.items.length;
          return (
            <button
              key={spot.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveSpot((cur) => (cur && cur.id === spot.id ? null : spot));
              }}
              title={`${meta.label}: ${spot.items.map((t) => t.name).join(", ")}`}
              className="tac-mono"
              style={{
                position: "absolute", left: `${spot.x}%`, top: `${spot.y}%`, transform: "translate(-50%,-50%)",
                // Hình "bông hoa" bo méo (blob) thay vì vòng tròn đơn giản —
                // lấy cảm hứng bố cục từ csnades.gg nhưng là hình tự vẽ bằng
                // CSS, không sao chép icon gốc của họ.
                width: count > 9 ? 34 : 28, height: count > 9 ? 34 : 28,
                borderRadius: "42% 58% 68% 32% / 45% 40% 60% 55%",
                border: `2px solid ${meta.color}`, background: `${meta.color}2E`,
                boxShadow: `0 0 0 2px #0E1117, 0 2px 6px rgba(0,0,0,0.5)`,
                color: meta.color, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", padding: 0, fontWeight: 800,
                fontSize: count > 9 ? 14 : 12.5,
                // Cũng cho click xuyên qua khi đang đặt callout mới, như các nhãn callout.
                pointerEvents: calloutPicking ? "none" : "auto",
              }}
            >
              {count}
            </button>
          );
        })}

        {/* Khi bấm vào 1 ghim nade: hiện ngay điểm đứng ném + đường kẻ nối
            tới điểm rơi TRỰC TIẾP trên bản đồ chính — không mở popup riêng. */}
        {activeSpot && (
          <>
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              {activeSpot.items.filter((t) => t.throwFrom).map((t) => (
                <line
                  key={t.id}
                  x1={`${t.throwFrom.x}%`} y1={`${t.throwFrom.y}%`} x2={`${activeSpot.x}%`} y2={`${activeSpot.y}%`}
                  stroke="#E8D44D" strokeWidth={1.5} strokeDasharray="5,4" opacity={0.9}
                />
              ))}
            </svg>

            <div title="Điểm rơi" style={{
              position: "absolute", left: `${activeSpot.x}%`, top: `${activeSpot.y}%`, transform: "translate(-50%,-50%)",
              width: 18, height: 18, borderRadius: "50%", background: "#E8D44D", border: "2px solid #0E1117",
              boxShadow: "0 0 0 4px #E8D44D44", zIndex: 4,
            }} />

            {activeSpot.items.filter((t) => t.throwFrom).map((t, i) => (
              <button
                key={t.id}
                onClick={(e) => { e.stopPropagation(); onJumpToTactic(t.tacticId, t.assignmentId); }}
                title={`Nhảy tới "${t.name}"`}
                className="tac-mono"
                style={{
                  position: "absolute", left: `${t.throwFrom.x}%`, top: `${t.throwFrom.y}%`, transform: "translate(-50%,-50%)",
                  width: 24, height: 24, borderRadius: "50%", background: "#5B9BD5", color: "#0E1117",
                  border: "2px solid #0E1117", cursor: "pointer", fontSize: 11.5, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5,
                  pointerEvents: calloutPicking ? "none" : "auto",
                }}
              >
                {i + 1}
              </button>
            ))}

            {activeSpot.items.every((t) => !t.throwFrom) && (
              <div style={{
                position: "absolute", left: `${activeSpot.x}%`, top: `${activeSpot.y}%`, transform: "translate(12px, -50%)",
                fontSize: 10.5, color: "#E8D44D", background: "rgba(14,17,23,0.85)", border: "1px solid #E8D44D55",
                borderRadius: 5, padding: "3px 7px", whiteSpace: "nowrap", pointerEvents: "none",
              }}>
                Chưa đặt điểm đứng ném
              </div>
            )}
          </>
        )}

        {/* Ô nhập tên khi thêm callout mới hoặc đổi tên callout có sẵn */}
        {(pendingPoint || renameTarget) && (() => {
          const pos = pendingPoint || renameTarget;
          return (
            <div
              data-callout-menu
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, 8px)",
                background: "#1B232E", border: "1px solid #3A4456", borderRadius: 8, padding: 8,
                display: "flex", gap: 6, boxShadow: "0 6px 18px rgba(0,0,0,0.5)", zIndex: 10,
              }}
            >
              <input
                autoFocus
                value={editorText}
                onChange={(e) => setEditorText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmEditor();
                  if (e.key === "Escape") cancelEditor();
                }}
                placeholder="Tên khu vực (VD: Jungle, Palace…)"
                className="tac-mono"
                style={{
                  background: "#141A22", border: "1px solid #2A3340", borderRadius: 6, padding: "6px 8px",
                  color: "#E8EAED", fontSize: 12.5, width: 180, outline: "none",
                }}
              />
              <button
                onClick={confirmEditor}
                style={{ background: "#6FCF9722", border: "1px solid #6FCF97", color: "#6FCF97", borderRadius: 6, padding: "0 10px", cursor: "pointer" }}
              >
                <Check size={14} />
              </button>
              <button
                onClick={cancelEditor}
                style={{ background: "#141A22", border: "1px solid #2A3340", color: "#B6BCC6", borderRadius: 6, padding: "0 10px", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })()}

        {/* Menu chuột phải: Đổi tên / Xoá */}
        {contextMenu && (
          <div
            data-callout-menu
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: "absolute", left: `${contextMenu.x}%`, top: `${contextMenu.y}%`, transform: "translate(-50%, 8px)",
              background: "#1B232E", border: "1px solid #3A4456", borderRadius: 8, padding: 4,
              boxShadow: "0 6px 18px rgba(0,0,0,0.5)", zIndex: 10, minWidth: 130,
            }}
          >
            <button
              onClick={() => openRename(contextMenu)}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                background: "transparent", border: "none", color: "#E8EAED", fontSize: 12.5,
                padding: "8px 10px", borderRadius: 6, cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#232C38")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Pencil size={13} /> Đổi tên
            </button>
            <button
              onClick={() => { onRemoveCallout(contextMenu.id); setContextMenu(null); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                background: "transparent", border: "none", color: "#E2574C", fontSize: 12.5,
                padding: "8px 10px", borderRadius: 6, cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#E2574C22")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Trash2 size={13} /> Xoá
            </button>
          </div>
        )}
      </div>

      {placed.length === 0 && (
        <div style={{ marginTop: 14, fontSize: 12.5, color: "#5C6573" }}>
          Chưa có chiến thuật nào được đặt vị trí trên bản đồ. Vào sửa một chiến thuật và bấm "Đặt điểm rơi" để nó hiện lên đây.
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <button
          onClick={onToggleCallouts}
          className="tac-chip"
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600,
            border: `1px solid ${calloutsEnabled ? "#6FCF97" : "#2A3340"}`,
            background: calloutsEnabled ? "#6FCF9722" : "#141A22",
            color: calloutsEnabled ? "#6FCF97" : "#B6BCC6",
          }}
        >
          <Tag size={14} /> {calloutsEnabled ? "Tắt Callouts" : "Enable callouts"}
        </button>
        {calloutsEnabled && (
          <button
            onClick={() => setCalloutPicking((v) => !v)}
            className="tac-chip"
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12.5,
              border: `1px solid ${calloutPicking ? "#5B9BD5" : "#2A3340"}`,
              background: calloutPicking ? "#5B9BD522" : "#141A22",
              color: calloutPicking ? "#5B9BD5" : "#B6BCC6",
            }}
          >
            <Plus size={14} /> {calloutPicking ? "Bấm vào bản đồ để đặt tên…" : "Thêm callout"}
          </button>
        )}
      </div>
      {calloutsEnabled && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#5C6573" }}>
          Bấm "Thêm callout" rồi chọn 1 điểm trên bản đồ, nhập tên và bấm ✓ — kéo 1 callout để di chuyển, giữ chuột rồi kéo để xoay, kéo núm nhỏ ở góc để phóng to/thu nhỏ, hoặc bấm chuột phải để Đổi tên / Xoá.
        </div>
      )}

      {activeSpot && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#8A93A3" }}>
          <Crosshair size={13} color="#E8D44D" />
          Bấm vào 1 điểm đứng ném (số thứ tự) để nhảy tới chiến thuật tương ứng trong bảng — bấm ra chỗ trống trên bản đồ để đóng.
          <button
            onClick={() => setActiveSpot(null)}
            className="tac-chip"
            style={{ fontSize: 11, padding: "4px 9px", borderRadius: 6, border: "1px solid #2A3340", background: "#141A22", color: "#B6BCC6", cursor: "pointer" }}
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   FORM (ADD / EDIT)
--------------------------------------------------------- */
function TacticForm({ initial, map, mapFloors, allTacticsOnMap, onCancel, onSave }) {
  const floors = mapFloors || [];
  const isMultiFloor = floors.length > 1;
  // Tầng đang hiển thị trong bản đồ thu nhỏ dùng để đặt vị trí — khi đặt
  // điểm cho 1 role, role đó sẽ được gán đúng tầng này.
  const [pickerFloorId, setPickerFloorId] = useState(floors[0]?.id || null);
  const pickerFloorObj = floors.find((f) => f.id === pickerFloorId) || floors[0] || null;
  const mapImageUrl = pickerFloorObj?.url || "";
  const [side, setSide] = useState(initial?.side || "CT");
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  // Đang đặt vị trí cho ĐÚNG 1 role nào đó: { assignmentId, mode } | null.
  // Vị trí (điểm rơi/điểm đứng ném) giờ thuộc về từng role, vì 1 chiến
  // thuật có thể có nhiều role, mỗi người ném 1 loại nade từ 1 chỗ khác
  // nhau — không còn chỉ 1 cặp điểm dùng chung cho cả chiến thuật nữa.
  const [placingFor, setPlacingFor] = useState(null);
  const [descImages, setDescImages] = useState(() =>
    (initial?.descImages || []).map((img) =>
      typeof img === "string" ? { id: uid(), src: img, caption: "" } : { id: img.id || uid(), src: img.src, caption: img.caption || "" }
    )
  );
  const [newDescImage, setNewDescImage] = useState("");
  const [descImageError, setDescImageError] = useState("");
  const [descImagesLoading, setDescImagesLoading] = useState(false);
  const descImageFilesRef = useRef(null);
  const [assignments, setAssignments] = useState(() => {
    const src = initial?.assignments?.length ? initial.assignments : [{ id: uid(), role: "", videoUrls: [{ id: uid(), url: "", desc: "", fileData: "", fileName: "" }], note: "", images: [] }];
    const legacyImages = (initial?.images || []).map((img) =>
      typeof img === "string" ? { id: uid(), src: img, caption: "" } : { id: img.id || uid(), src: img.src, caption: img.caption || "" }
    );
    return src.map((a, idx) => {
      const ownImages = Array.isArray(a.images)
        ? a.images.map((img) => (typeof img === "string" ? { id: uid(), src: img, caption: "" } : { id: img.id || uid(), src: img.src, caption: img.caption || "" }))
        : [];
      return {
        id: a.id || uid(),
        role: a.role || "",
        note: a.note || "",
        videoUrls: Array.isArray(a.videoUrls) && a.videoUrls.length
          ? a.videoUrls.map((v) => ({ id: v.id || uid(), url: v.url || "", desc: v.desc || "", fileData: v.fileData || "", fileName: v.fileName || "" }))
          : a.videoUrl
          ? [{ id: uid(), url: a.videoUrl, desc: "", fileData: "", fileName: "" }]
          : [{ id: uid(), url: "", desc: "", fileData: "", fileName: "" }],
        images: ownImages.length ? ownImages : (idx === 0 ? legacyImages : []),
        // Loại nade role này sẽ ném — dùng để phân loại chính xác theo từng
        // role (thay vì dò từ khoá trong text) và để gom/snap điểm rơi
        // trùng loại trên bản đồ.
        nadeType: a.nadeType || "",
        // Vị trí riêng của role này. Dữ liệu cũ (trước khi có vị trí theo
        // từng role) lưu landAt/throwFrom ở cấp chiến thuật — di cư sang
        // role đầu tiên để không mất dữ liệu đã đặt trước đó.
        landAt: a.landAt || (idx === 0 ? initial?.landAt || null : null),
        throwFrom: a.throwFrom || (idx === 0 ? initial?.throwFrom || null : null),
        // Tầng (floor) chứa điểm rơi/đứng ném — chỉ có ý nghĩa với map
        // nhiều tầng như Nuke; map 1 tầng bỏ qua field này.
        floorId: a.floorId || null,
      };
    });
  });
  const [newImageDrafts, setNewImageDrafts] = useState({}); // { [assignmentId]: string }
  const [imageError, setImageError] = useState("");
  const [imagesLoadingFor, setImagesLoadingFor] = useState(null); // assignmentId
  const [videoError, setVideoError] = useState("");
  const [videoLoadingFor, setVideoLoadingFor] = useState(null); // videoId
  const nameRef = useRef(null);
  const imageFilesRef = useRef(null);
  const videoFilesRef = useRef(null);
  const uploadTargetRef = useRef(null); // assignmentId currently targeted by hidden image file input
  const uploadVideoTargetRef = useRef(null); // { assignmentId, videoId } targeted by hidden video file input

  useEffect(() => { nameRef.current?.focus(); }, []);

  const updateAssignment = (id, field, value) => {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };
  const addAssignment = () => setAssignments((prev) => [...prev, { id: uid(), role: "", videoUrls: [{ id: uid(), url: "", desc: "", fileData: "", fileName: "" }], note: "", images: [], nadeType: "", landAt: null, throwFrom: null, floorId: null }]);
  const removeAssignment = (id) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    setPlacingFor((cur) => (cur?.assignmentId === id ? null : cur));
  };
  const setAssignmentPoint = (assignmentId, field, value) => {
    setAssignments((prev) => prev.map((a) => (a.id === assignmentId ? { ...a, [field]: value } : a)));
  };
  // Đặt điểm (landAt/throwFrom) VÀ ghi luôn tầng đang chọn trong bản đồ thu
  // nhỏ — dùng khi người dùng thực sự bấm đặt vị trí (không dùng cho nút
  // "Xoá điểm", chỉ cần xoá toạ độ chứ không cần đổi tầng).
  const placeAssignmentPoint = (assignmentId, field, value) => {
    setAssignments((prev) => prev.map((a) => (
      a.id === assignmentId ? { ...a, [field]: value, floorId: isMultiFloor ? pickerFloorId : a.floorId } : a
    )));
  };

  const updateVideoField = (assignmentId, videoId, field, value) => {
    setAssignments((prev) => prev.map((a) => (
      a.id === assignmentId
        ? { ...a, videoUrls: a.videoUrls.map((v) => (v.id === videoId ? { ...v, [field]: value } : v)) }
        : a
    )));
  };
  const addVideoUrl = (assignmentId) => {
    setAssignments((prev) => prev.map((a) => (
      a.id === assignmentId ? { ...a, videoUrls: [...a.videoUrls, { id: uid(), url: "", desc: "", fileData: "", fileName: "" }] } : a
    )));
  };
  const removeVideoUrl = (assignmentId, videoId) => {
    setAssignments((prev) => prev.map((a) => (
      a.id === assignmentId ? { ...a, videoUrls: a.videoUrls.filter((v) => v.id !== videoId) } : a
    )));
  };

  const triggerVideoUpload = (assignmentId, videoId) => {
    uploadVideoTargetRef.current = { assignmentId, videoId };
    videoFilesRef.current?.click();
  };
  const clearVideoFile = (assignmentId, videoId) => {
    setAssignments((prev) => prev.map((a) => (
      a.id === assignmentId
        ? { ...a, videoUrls: a.videoUrls.map((v) => (v.id === videoId ? { ...v, fileData: "", fileName: "" } : v)) }
        : a
    )));
  };
  const handleVideoFile = (e) => {
    const target = uploadVideoTargetRef.current;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !target) return;
    if (!file.type.startsWith("video/")) { setVideoError("Vui lòng chọn một file video."); return; }
    setVideoError("");
    setVideoLoadingFor(target.videoId);
    const reader = new FileReader();
    reader.onload = async () => {
      const hosted = await hostImage(reader.result);
      setAssignments((prev) => prev.map((a) => (
        a.id === target.assignmentId
          ? { ...a, videoUrls: a.videoUrls.map((v) => (v.id === target.videoId ? { ...v, fileData: hosted, fileName: file.name, url: "" } : v)) }
          : a
      )));
      setVideoLoadingFor(null);
    };
    reader.onerror = () => {
      setVideoError("Không đọc được file video, thử lại nhé.");
      setVideoLoadingFor(null);
    };
    reader.readAsDataURL(file);
  };

  const addAssignmentImage = (assignmentId) => {
    const v = (newImageDrafts[assignmentId] || "").trim();
    if (!v) return;
    setAssignments((prev) => prev.map((a) => (
      a.id === assignmentId ? { ...a, images: [...a.images, { id: uid(), src: v, caption: "" }] } : a
    )));
    setNewImageDrafts((prev) => ({ ...prev, [assignmentId]: "" }));
  };
  const removeAssignmentImage = (assignmentId, imageId) => {
    setAssignments((prev) => prev.map((a) => (
      a.id === assignmentId ? { ...a, images: a.images.filter((img) => img.id !== imageId) } : a
    )));
  };
  const updateAssignmentImageCaption = (assignmentId, imageId, caption) => {
    setAssignments((prev) => prev.map((a) => (
      a.id === assignmentId ? { ...a, images: a.images.map((img) => (img.id === imageId ? { ...img, caption } : img)) } : a
    )));
  };

  const triggerImageUpload = (assignmentId) => {
    uploadTargetRef.current = assignmentId;
    imageFilesRef.current?.click();
  };

  const handleImageFiles = (e) => {
    const assignmentId = uploadTargetRef.current;
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || !assignmentId) return;
    setImageError("");
    const valid = files.filter((f) => {
      if (!f.type.startsWith("image/")) { setImageError("Một số file không phải ảnh đã bị bỏ qua."); return false; }
      return true;
    });
    if (!valid.length) return;
    setImagesLoadingFor(assignmentId);
    Promise.all(valid.map((f) => compressImage(f))).then((results) => {
      setAssignments((prev) => prev.map((a) => (
        a.id === assignmentId ? { ...a, images: [...a.images, ...results.map((src) => ({ id: uid(), src, caption: "" }))] } : a
      )));
    }).catch(() => {
      setImageError("Không đọc được một số file ảnh, thử lại nhé.");
    }).finally(() => setImagesLoadingFor(null));
  };

  const addDescImage = () => {
    const v = newDescImage.trim();
    if (!v) return;
    setDescImages((prev) => [...prev, { id: uid(), src: v, caption: "" }]);
    setNewDescImage("");
  };
  const removeDescImage = (id) => setDescImages((prev) => prev.filter((img) => img.id !== id));
  const updateDescImageCaption = (id, caption) => setDescImages((prev) => prev.map((img) => (img.id === id ? { ...img, caption } : img)));
  const handleDescImageFiles = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const valid = files.filter((f) => {
      if (!f.type.startsWith("image/")) { setDescImageError("Một số file không phải ảnh đã bị bỏ qua."); return false; }
      return true;
    });
    if (!valid.length) return;
    setDescImageError("");
    setDescImagesLoading(true);
    Promise.all(valid.map((f) => compressImage(f))).then((results) => {
      setDescImages((prev) => [...prev, ...results.map((src) => ({ id: uid(), src, caption: "" }))]);
    }).catch(() => {
      setDescImageError("Không đọc được một số file ảnh, thử lại nhé.");
    }).finally(() => setDescImagesLoading(false));
  };

  const canSave = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSave) return;
    onSave({
      id: initial?.id,
      map,
      side,
      name: name.trim(),
      description: description.trim(),
      descImages,
      assignments: assignments
        .map((a) => ({ ...a, videoUrls: a.videoUrls.filter((v) => v.url.trim() || v.fileData) }))
        .filter((a) => a.role.trim() || a.videoUrls.length || a.note.trim() || a.images.length || a.landAt || a.throwFrom),
    });
  };

  // Các điểm rơi ĐÃ CÓ từ những chiến thuật khác trên cùng map, gom theo vị
  // trí + loại nade — hiển thị mờ trên bản đồ thu nhỏ để biết chỗ nào đã có
  // người ném loại nade gì rồi, và cho phép bấm trúng để DÙNG LẠI chính xác
  // toạ độ đó (gom chung 1 ghim trên "Bản đồ Nade" thay vì tạo điểm lệch).
  const existingSpots = useMemo(() => {
    const GRID = 2.5;
    const groups = new Map();
    (allTacticsOnMap || []).forEach((t) => {
      if (initial && t.id === initial.id) return; // không tính chính chiến thuật đang sửa
      (t.assignments || []).forEach((a) => {
        if (!a.landAt) return;
        // Map nhiều tầng: chỉ tham khảo điểm của đúng tầng đang xem trong
        // bản đồ thu nhỏ, tránh lẫn toạ độ 2 tầng khác nhau lên cùng 1 ảnh.
        if (isMultiFloor && (a.floorId || floors[0]?.id) !== pickerFloorId) return;
        const cats = classifyAssignment(t, a).filter((c) => c !== "combination");
        const cat = cats[0] || null;
        if (!cat) return;
        const key = `${cat}_${Math.round(a.landAt.x / GRID)}_${Math.round(a.landAt.y / GRID)}`;
        if (!groups.has(key)) groups.set(key, { category: cat, xs: [], ys: [], count: 0 });
        const g = groups.get(key);
        g.xs.push(a.landAt.x);
        g.ys.push(a.landAt.y);
        g.count += 1;
      });
    });
    return [...groups.values()].map((g) => ({
      category: g.category,
      x: g.xs.reduce((s, v) => s + v, 0) / g.xs.length,
      y: g.ys.reduce((s, v) => s + v, 0) / g.ys.length,
      count: g.count,
    }));
  }, [allTacticsOnMap, initial, isMultiFloor, pickerFloorId, floors]);

  // Role đang được đặt vị trí (nếu có) và loại nade của role đó — dùng để
  // biết điểm rơi có sẵn nào "cùng loại" để làm nổi bật cho phép snap vào.
  const placingAssignment = placingFor ? assignments.find((a) => a.id === placingFor.assignmentId) : null;
  const placingNadeType = placingAssignment?.nadeType || null;

  // Click lên ảnh bản đồ thu nhỏ trong lúc đang ở chế độ "đặt vị trí" cho
  // 1 role cụ thể (placingFor) — đổi toạ độ click thành phần trăm so với
  // kích thước ảnh đang hiển thị, rồi gán cho đúng role đó. Nếu click gần
  // 1 điểm rơi có sẵn CÙNG LOẠI nade, tự động hút (snap) vào đúng toạ độ đó
  // để các điểm trùng vị trí gom đúng thành 1 ghim trên "Bản đồ Nade".
  const handlePickerClick = (e) => {
    if (!placingFor) return;
    const rect = e.currentTarget.getBoundingClientRect();
    let x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    let y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    if (placingFor.mode === "landAt" && placingNadeType) {
      const SNAP = 3;
      const near = existingSpots.find((s) => s.category === placingNadeType && Math.hypot(s.x - x, s.y - y) <= SNAP);
      if (near) { x = near.x; y = near.y; }
    }
    placeAssignmentPoint(placingFor.assignmentId, placingFor.mode, { x, y });
    setPlacingFor(null);
  };

  // Bấm trực tiếp vào 1 điểm rơi có sẵn (cùng loại nade) để dùng lại chính
  // xác toạ độ đó cho role đang đặt.
  const handleUseExistingSpot = (spot) => {
    if (!placingFor || placingFor.mode !== "landAt") return;
    placeAssignmentPoint(placingFor.assignmentId, "landAt", { x: spot.x, y: spot.y });
    setPlacingFor(null);
  };

  const inputStyle = {
    width: "100%", background: "#0E1117", border: "1px solid #2A3340", borderRadius: 8,
    color: "#E8EAED", fontSize: 13.5, padding: "9px 11px",
  };
  const labelStyle = { fontSize: 11.5, color: "#8A93A3", marginBottom: 6, display: "block", letterSpacing: "0.04em", textTransform: "uppercase" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,7,10,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 90, padding: 20 }}>
      <div
        className="tac-root tac-fade-in tac-scroll"
        style={{ width: mapImageUrl ? 760 : 620, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", background: "#161B22", border: "1px solid #2A3340", borderRadius: 14, padding: 24 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div className="tac-mono" style={{ fontSize: 11, color: "#5C6573", marginBottom: 2 }}>[ {map} ]</div>
            <div className="tac-display" style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>
              {initial ? "Sửa chiến thuật" : "Thêm chiến thuật mới"}
            </div>
          </div>
          <button onClick={onCancel} className="tac-iconbtn" style={{ background: "transparent", border: "none", color: "#8A93A3", cursor: "pointer", padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Side */}
        <div style={{ marginBottom: 16 }}>
          <span style={labelStyle}>Bên thực hiện</span>
          <div style={{ display: "flex", gap: 8 }}>
            {["CT", "T"].map((s) => {
              const m = SIDE_META[s];
              const active = side === s;
              return (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className="tac-chip"
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "9px 0", borderRadius: 8, fontWeight: 600, fontSize: 13.5,
                    border: `1px solid ${active ? m.color : "#2A3340"}`,
                    background: active ? `${m.color}22` : "transparent",
                    color: active ? m.color : "#8A93A3",
                  }}
                >
                  <m.icon size={14} /> {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <span style={labelStyle}>Tên chiến thuật (Tatic)</span>
          <input ref={nameRef} className="tac-input" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder='VD: "Chiếm water nhanh nhất"' />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 18 }}>
          <span style={labelStyle}>Mô tả</span>
          <textarea
            className="tac-textarea"
            style={{ ...inputStyle, minHeight: 90, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả chi tiết cách triển khai…"
          />

          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 11, color: "#5C6573", marginBottom: 6, display: "block" }}>Hình ảnh minh hoạ cho mô tả</span>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                className="tac-input"
                style={inputStyle}
                value={newDescImage}
                onChange={(e) => setNewDescImage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addDescImage(); }}
                placeholder="Dán link ảnh rồi nhấn Enter…"
              />
              <button onClick={addDescImage} className="tac-iconbtn" style={{ background: "#1B232E", border: "1px solid #2A3340", borderRadius: 8, padding: "0 12px", color: "#E8EAED", cursor: "pointer", flexShrink: 0 }}>
                <Link2 size={14} />
              </button>
              <input
                ref={descImageFilesRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleDescImageFiles}
                style={{ display: "none" }}
              />
              <button
                onClick={() => descImageFilesRef.current?.click()}
                className="tac-iconbtn"
                style={{ display: "flex", alignItems: "center", gap: 6, background: "#1B232E", border: "1px solid #2A3340", borderRadius: 8, padding: "0 12px", color: "#E8EAED", cursor: "pointer", fontSize: 12.5, flexShrink: 0, whiteSpace: "nowrap" }}
              >
                {descImagesLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <ImageIcon size={14} />}
                Tải ảnh lên
              </button>
            </div>
            {descImageError && <div style={{ fontSize: 12, color: "#E2574C", marginBottom: 8 }}>{descImageError}</div>}
            {descImages.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {descImages.map((img) => (
                  <div key={img.id} style={{ display: "flex", gap: 8, alignItems: "center", background: "#161B22", border: "1px solid #232B36", borderRadius: 7, padding: 7 }}>
                    <img src={img.src} alt="" style={{ width: 50, height: 34, objectFit: "cover", borderRadius: 5, border: "1px solid #2A3340", flexShrink: 0 }} />
                    <input
                      className="tac-input"
                      style={{ ...inputStyle, flex: 1, padding: "7px 10px" }}
                      value={img.caption}
                      onChange={(e) => updateDescImageCaption(img.id, e.target.value)}
                      placeholder="Mô tả ảnh (tuỳ chọn)"
                    />
                    <button onClick={() => removeDescImage(img.id)} style={{ background: "none", border: "none", color: "#5C6573", cursor: "pointer", flexShrink: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vị trí trên bản đồ (cho chế độ Bản đồ Nade) — ĐẶT RIÊNG CHO TỪNG
            ROLE bên dưới, vì 1 chiến thuật có thể có nhiều role, mỗi người
            ném 1 loại nade từ 1 vị trí khác nhau. Bản đồ dùng chung này chỉ
            hiển thị gộp tất cả các vị trí đã đặt để dễ hình dung; các nút
            "Đặt điểm rơi / điểm đứng ném" nằm trong từng thẻ role ở dưới. */}
        <div style={{ marginBottom: 18 }}>
          <span style={labelStyle}>Vị trí trên bản đồ (hiện ở chế độ "Bản đồ Nade")</span>
          {!mapImageUrl ? (
            <div style={{ fontSize: 12.5, color: "#5C6573", border: "1px dashed #2A3340", borderRadius: 8, padding: "10px 12px" }}>
              Map {map} chưa có ảnh sơ đồ — thêm ảnh ở màn hình chính trước để đặt được vị trí nade.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {isMultiFloor && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {floors.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setPickerFloorId(f.id)}
                      className="tac-chip"
                      style={{
                        display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 7, cursor: "pointer", fontSize: 12,
                        border: `1px solid ${pickerFloorId === f.id ? "#5B9BD5" : "#2A3340"}`,
                        background: pickerFloorId === f.id ? "#5B9BD522" : "#161B22",
                        color: pickerFloorId === f.id ? "#5B9BD5" : "#B6BCC6",
                      }}
                    >
                      <Layers size={12} /> {f.label}
                    </button>
                  ))}
                </div>
              )}
              <div
                onClick={handlePickerClick}
                style={{
                  position: "relative", display: "inline-block", maxWidth: "100%", borderRadius: 8, overflow: "hidden",
                  border: "1px solid #2A3340", background: "#000", cursor: placingFor ? "crosshair" : "default", lineHeight: 0,
                }}
              >
                <img src={mapImageUrl} alt="" style={{ display: "block", maxWidth: "100%", maxHeight: "60vh", pointerEvents: "none" }} />

                {/* Điểm rơi ĐÃ CÓ từ các chiến thuật khác, theo từng loại
                    nade — mờ đi để làm nền tham khảo; khi đang đặt điểm rơi
                    cho 1 role, điểm cùng loại nade sẽ sáng rõ và bấm được để
                    dùng lại chính xác toạ độ đó. */}
                {existingSpots.map((s, si) => {
                  const meta = CATEGORY_META[s.category];
                  const isSnapTarget = placingFor?.mode === "landAt" && placingNadeType && s.category === placingNadeType;
                  return (
                    <div
                      key={si}
                      onClick={isSnapTarget ? (e) => { e.stopPropagation(); handleUseExistingSpot(s); } : undefined}
                      title={`${meta?.label || s.category}: ${s.count} chiến thuật đã ném ở đây${isSnapTarget ? " — bấm để dùng lại vị trí này" : ""}`}
                      className="tac-mono"
                      style={{
                        position: "absolute", left: `${s.x}%`, top: `${s.y}%`, transform: "translate(-50%,-50%)",
                        width: isSnapTarget ? 22 : 14, height: isSnapTarget ? 22 : 14, borderRadius: "50%",
                        background: meta ? `${meta.color}${isSnapTarget ? "" : "55"}` : "#5C657355",
                        border: `1.5px solid ${meta ? meta.color : "#5C6573"}`,
                        opacity: isSnapTarget ? 1 : (placingFor ? 0.25 : 0.55),
                        cursor: isSnapTarget ? "pointer" : "default",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: isSnapTarget ? 10.5 : 9, fontWeight: 700, color: "#0E1117",
                        boxShadow: isSnapTarget ? `0 0 0 3px ${meta.color}44` : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {s.count > 1 ? s.count : ""}
                    </div>
                  );
                })}

                {assignments.map((a, i) => {
                  // Chỉ vẽ marker của role thuộc ĐÚNG tầng đang xem trong
                  // picker — tránh toạ độ tầng khác lạc sang ảnh tầng này.
                  if (isMultiFloor && (a.landAt || a.throwFrom) && (a.floorId || floors[0]?.id) !== pickerFloorId) return null;
                  return (
                  <React.Fragment key={a.id}>
                    {a.landAt && a.throwFrom && (
                      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                        <line
                          x1={`${a.throwFrom.x}%`} y1={`${a.throwFrom.y}%`} x2={`${a.landAt.x}%`} y2={`${a.landAt.y}%`}
                          stroke="#E8D44D" strokeWidth={1.3} strokeDasharray="4,3" opacity={0.85}
                        />
                      </svg>
                    )}
                    {a.landAt && (
                      <div title={`Điểm rơi — role #${i + 1}${a.role ? `: ${a.role}` : ""}`} className="tac-mono" style={{
                        position: "absolute", left: `${a.landAt.x}%`, top: `${a.landAt.y}%`, transform: "translate(-50%,-50%)",
                        width: 18, height: 18, borderRadius: "50%", background: "#E8D44D", border: "2px solid #0E1117",
                        boxShadow: "0 0 0 2px #E8D44D88", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9.5, fontWeight: 700, color: "#0E1117",
                      }}>
                        {i + 1}
                      </div>
                    )}
                    {a.throwFrom && (
                      <div title={`Điểm đứng ném — role #${i + 1}${a.role ? `: ${a.role}` : ""}`} className="tac-mono" style={{
                        position: "absolute", left: `${a.throwFrom.x}%`, top: `${a.throwFrom.y}%`, transform: "translate(-50%,-50%)",
                        width: 15, height: 15, borderRadius: "50%", background: "#5B9BD5", border: "2px solid #0E1117",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#0E1117",
                      }}>
                        {i + 1}
                      </div>
                    )}
                  </React.Fragment>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: "#5C6573" }}>
                {placingFor
                  ? (placingFor.mode === "landAt" && placingNadeType
                      ? "Bấm vào bản đồ để đặt điểm mới, hoặc bấm vào 1 điểm sáng rõ (cùng loại nade) để dùng lại đúng vị trí đó."
                      : "Bấm vào bản đồ bên trên để đặt điểm cho role đang chọn…")
                  : "Điểm rơi (vàng, số thứ tự role) dùng để gom các role ném cùng 1 chỗ lại thành 1 ghim trên \"Bản đồ Nade\". Điểm đứng ném (xanh) tuỳ chọn — nếu đặt, sẽ vẽ đường kẻ nối 2 điểm. Các chấm mờ là điểm rơi đã có từ chiến thuật khác, theo từng loại nade — chọn loại nade cho role rồi bấm \"Đặt điểm rơi\" để thấy gợi ý cùng loại."}
              </div>
            </div>
          )}
        </div>

        {/* Assignments */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ ...labelStyle, marginBottom: 0 }}>Role &amp; video hướng dẫn</span>
            <button onClick={addAssignment} className="tac-chip" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#5B9BD5", background: "transparent", border: "none" }}>
              <Plus size={13} /> Thêm role
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {assignments.map((a, i) => (
              <div key={a.id} style={{ background: "#0E1117", border: "1px solid #232B36", borderRadius: 9, padding: 12, position: "relative" }}>
                {assignments.length > 1 && (
                  <button onClick={() => removeAssignment(a.id)} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "#5C6573", cursor: "pointer" }}>
                    <X size={14} />
                  </button>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span className="tac-mono" title="Số thứ tự tương ứng với ghim trên bản đồ phía trên" style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: "50%", background: "#E8D44D22", border: "1px solid #E8D44D55",
                    color: "#E8D44D", fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {i + 1}
                  </span>
                  <input
                    className="tac-input"
                    style={{ ...inputStyle, fontWeight: 600 }}
                    value={a.role}
                    onChange={(e) => updateAssignment(a.id, "role", e.target.value)}
                    placeholder={`Role #${i + 1} (VD: Người đi site A)`}
                  />
                </div>

                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "#5C6573", marginBottom: 4, display: "block" }}>Loại nade sẽ ném</span>
                  <select
                    className="tac-input"
                    style={{ ...inputStyle, cursor: "pointer" }}
                    value={a.nadeType}
                    onChange={(e) => updateAssignment(a.id, "nadeType", e.target.value)}
                  >
                    {NADE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {mapImageUrl && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    <button
                      type="button"
                      onClick={() => setPlacingFor(
                        placingFor?.assignmentId === a.id && placingFor?.mode === "landAt" ? null : { assignmentId: a.id, mode: "landAt" }
                      )}
                      className="tac-chip"
                      style={{
                        display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 11.5,
                        border: `1px solid ${placingFor?.assignmentId === a.id && placingFor?.mode === "landAt" ? "#E8D44D" : "#2A3340"}`,
                        background: placingFor?.assignmentId === a.id && placingFor?.mode === "landAt" ? "#E8D44D22" : "#161B22",
                        color: placingFor?.assignmentId === a.id && placingFor?.mode === "landAt" ? "#E8D44D" : "#B6BCC6",
                      }}
                    >
                      <Target size={12} />
                      {placingFor?.assignmentId === a.id && placingFor?.mode === "landAt" ? "Bấm vào bản đồ…" : (a.landAt ? "Đổi điểm rơi" : "Đặt điểm rơi")}
                    </button>
                    {a.landAt && (
                      <button type="button" onClick={() => setAssignmentPoint(a.id, "landAt", null)} className="tac-iconbtn" style={{ fontSize: 11, color: "#5C6573", background: "transparent", border: "1px dashed #2A3340", borderRadius: 7, padding: "5px 9px", cursor: "pointer" }}>
                        Xoá điểm rơi
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPlacingFor(
                        placingFor?.assignmentId === a.id && placingFor?.mode === "throwFrom" ? null : { assignmentId: a.id, mode: "throwFrom" }
                      )}
                      className="tac-chip"
                      style={{
                        display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 11.5,
                        border: `1px solid ${placingFor?.assignmentId === a.id && placingFor?.mode === "throwFrom" ? "#5B9BD5" : "#2A3340"}`,
                        background: placingFor?.assignmentId === a.id && placingFor?.mode === "throwFrom" ? "#5B9BD522" : "#161B22",
                        color: placingFor?.assignmentId === a.id && placingFor?.mode === "throwFrom" ? "#5B9BD5" : "#B6BCC6",
                      }}
                    >
                      <MapPin size={12} />
                      {placingFor?.assignmentId === a.id && placingFor?.mode === "throwFrom" ? "Bấm vào bản đồ…" : (a.throwFrom ? "Đổi điểm đứng ném" : "Đặt điểm đứng ném")}
                    </button>
                    {a.throwFrom && (
                      <button type="button" onClick={() => setAssignmentPoint(a.id, "throwFrom", null)} className="tac-iconbtn" style={{ fontSize: 11, color: "#5C6573", background: "transparent", border: "1px dashed #2A3340", borderRadius: 7, padding: "5px 9px", cursor: "pointer" }}>
                        Xoá điểm ném
                      </button>
                    )}
                  </div>
                )}

                <span style={{ fontSize: 11, color: "#5C6573", marginBottom: 6, display: "block" }}>Video đính kèm</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                  {a.videoUrls.map((v, vi) => (
                    <div key={v.id} style={{ display: "flex", gap: 6, alignItems: "flex-start", background: "#161B22", border: "1px solid #232B36", borderRadius: 7, padding: 8 }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                        <input
                          className="tac-input"
                          style={inputStyle}
                          value={v.desc}
                          onChange={(e) => updateVideoField(a.id, v.id, "desc", e.target.value)}
                          placeholder={`Mô tả video #${vi + 1} (vd: Ném lửa or smoke upper - 13p13s)`}
                        />
                        {v.fileData ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0E1117", border: "1px solid #2A3340", borderRadius: 8, padding: "9px 11px" }}>
                            <Play size={14} style={{ color: "#5B9BD5", flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: "#E8EAED", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {v.fileName || "Video đã tải lên"}
                            </span>
                            <button onClick={() => clearVideoFile(a.id, v.id)} style={{ background: "none", border: "none", color: "#5C6573", cursor: "pointer", flexShrink: 0 }}>
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 6 }}>
                            <input
                              className="tac-input"
                              style={inputStyle}
                              value={v.url}
                              onChange={(e) => updateVideoField(a.id, v.id, "url", e.target.value)}
                              placeholder="Dán link Youtube (vd: https://youtu.be/ID?t=793)"
                            />
                            <button
                              onClick={() => triggerVideoUpload(a.id, v.id)}
                              className="tac-iconbtn"
                              style={{ display: "flex", alignItems: "center", gap: 6, background: "#1B232E", border: "1px solid #2A3340", borderRadius: 8, padding: "0 12px", color: "#E8EAED", cursor: "pointer", fontSize: 12.5, flexShrink: 0, whiteSpace: "nowrap" }}
                            >
                              {videoLoadingFor === v.id ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={13} />}
                              Tải video lên
                            </button>
                          </div>
                        )}
                      </div>
                      {a.videoUrls.length > 1 && (
                        <button onClick={() => removeVideoUrl(a.id, v.id)} style={{ background: "none", border: "none", color: "#5C6573", cursor: "pointer", flexShrink: 0, paddingTop: 8 }}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {videoError && <div style={{ fontSize: 12, color: "#E2574C", marginBottom: 8 }}>{videoError}</div>}
                <button
                  onClick={() => addVideoUrl(a.id)}
                  className="tac-chip"
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#5B9BD5", background: "transparent", border: "none", padding: 0, marginBottom: 12 }}
                >
                  <Plus size={12} /> Thêm video khác
                </button>

                <input
                  className="tac-input"
                  style={{ ...inputStyle, marginBottom: 12 }}
                  value={a.note}
                  onChange={(e) => updateAssignment(a.id, "note", e.target.value)}
                  placeholder="Ghi chú thêm (tuỳ chọn)"
                />

                {/* Images for this role */}
                <div style={{ borderTop: "1px solid #232B36", paddingTop: 10 }}>
                  <span style={{ fontSize: 11, color: "#5C6573", marginBottom: 6, display: "block" }}>Hình ảnh cho role này</span>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      className="tac-input"
                      style={inputStyle}
                      value={newImageDrafts[a.id] || ""}
                      onChange={(e) => setNewImageDrafts((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") addAssignmentImage(a.id); }}
                      placeholder="Dán link ảnh rồi nhấn Enter…"
                    />
                    <button onClick={() => addAssignmentImage(a.id)} className="tac-iconbtn" style={{ background: "#1B232E", border: "1px solid #2A3340", borderRadius: 8, padding: "0 12px", color: "#E8EAED", cursor: "pointer", flexShrink: 0 }}>
                      <Link2 size={14} />
                    </button>
                    <button
                      onClick={() => triggerImageUpload(a.id)}
                      className="tac-iconbtn"
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "#1B232E", border: "1px solid #2A3340", borderRadius: 8, padding: "0 12px", color: "#E8EAED", cursor: "pointer", fontSize: 12.5, flexShrink: 0, whiteSpace: "nowrap" }}
                    >
                      {imagesLoadingFor === a.id ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <ImageIcon size={14} />}
                      Tải ảnh lên
                    </button>
                  </div>
                  {a.images.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {a.images.map((img) => (
                        <div key={img.id} style={{ display: "flex", gap: 8, alignItems: "center", background: "#161B22", border: "1px solid #232B36", borderRadius: 7, padding: 7 }}>
                          <img src={img.src} alt="" style={{ width: 50, height: 34, objectFit: "cover", borderRadius: 5, border: "1px solid #2A3340", flexShrink: 0 }} />
                          <input
                            className="tac-input"
                            style={{ ...inputStyle, flex: 1, padding: "7px 10px" }}
                            value={img.caption}
                            onChange={(e) => updateAssignmentImageCaption(a.id, img.id, e.target.value)}
                            placeholder="Mô tả ảnh (tuỳ chọn)"
                          />
                          <button onClick={() => removeAssignmentImage(a.id, img.id)} style={{ background: "none", border: "none", color: "#5C6573", cursor: "pointer", flexShrink: 0 }}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {imageError && <div style={{ fontSize: 12, color: "#E2574C", marginTop: 8 }}>{imageError}</div>}
          <input
            ref={imageFilesRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageFiles}
            style={{ display: "none" }}
          />
          <input
            ref={videoFilesRef}
            type="file"
            accept="video/*"
            onChange={handleVideoFile}
            style={{ display: "none" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onCancel} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #2A3340", background: "transparent", color: "#B6BCC6", cursor: "pointer", fontSize: 13.5 }}>
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSave}
            style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: canSave ? "#5B9BD5" : "#2A3340", color: canSave ? "#0E1117" : "#5C6573", cursor: canSave ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 13.5 }}
          >
            Lưu chiến thuật
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   CONFIRM DIALOG
--------------------------------------------------------- */
function ConfirmDialog({
  title, message, onCancel, onConfirm,
  confirmLabel = "Xóa", confirmColor = "#E2574C",
  extraLabel, onExtra, extraColor = "#5B9BD5",
}) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,7,10,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 95, padding: 20 }}>
      <div className="tac-root tac-fade-in" style={{ width: 400, background: "#161B22", border: "1px solid #2A3340", borderRadius: 14, padding: 22 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
          <AlertTriangle size={18} style={{ color: confirmColor, flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className="tac-display" style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 13, color: "#8A93A3", lineHeight: 1.5 }}>{message}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 10 }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #2A3340", background: "transparent", color: "#B6BCC6", cursor: "pointer", fontSize: 13 }}>
            Hủy
          </button>
          {extraLabel && onExtra && (
            <button onClick={onExtra} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: extraColor, color: "#0E1117", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              {extraLabel}
            </button>
          )}
          <button onClick={onConfirm} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: confirmColor, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
