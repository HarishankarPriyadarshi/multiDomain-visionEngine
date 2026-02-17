// Filename - components/SidebarData.js

import React from "react";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import * as IoIcons from "react-icons/io";
import * as RiIcons from "react-icons/ri";

export const SidebarData = [
  {
    title: "Edge Detection",
    path: "/edge",
    icon: <AiIcons.AiOutlineScissor />,
    subNav: [
      { title: "First‑Order", path: "/edge/first-order", icon: <AiIcons.AiOutlineLine /> },
      { title: "Second‑Order", path: "/edge/second-order", icon: <AiIcons.AiOutlineSwapVertical /> },
      { title: "Canny", path: "/edge/canny", icon: <AiIcons.AiOutlineSliders /> },
      { title: "Morphological", path: "/edge/morphological", icon: <RiIcons.RiShape2Fill /> },
    ],
  },
  {
    title: "Sampling",
    path: "/sampling",
    icon: <AiIcons.AiOutlineAreaChart />,
  },
  {
    title: "Region Analysis",
    path: "/region",
    icon: <AiIcons.AiOutlineSelect />,
    subNav: [
      { title: "Region Growing", path: "/region/growth", icon: <AiIcons.AiOutlineColumnWidth /> },
      { title: "Split & Merge", path: "/region/split-merge", icon: <AiIcons.AiOutlinePartition /> },
      { title: "Watershed", path: "/region/watershed", icon: <AiIcons.AiOutlineDropbox /> },
    ],
  },
  {
    title: "Compression",
    path: "/compression",
    icon: <AiIcons.AiOutlineCompress />,
    subNav: [
      { title: "Run‑Length Encoding", path: "/compression/rle", icon: <AiIcons.AiOutlineOrderedList /> },
      { title: "Huffman Coding", path: "/compression/huffman", icon: <FaIcons.FaTree /> },
      { title: "Transform (DCT/DST)", path: "/compression/transform", icon: <IoIcons.IoIosGitCompare /> },
      { title: "JPEG", path: "/compression/jpeg", icon: <AiIcons.AiOutlineFileImage /> },
    ],
  },
];
