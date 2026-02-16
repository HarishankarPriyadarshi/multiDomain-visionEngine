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
    },
    {
        title: "Compression",
        path: "/comp",
        icon: <AiIcons.AiOutlineCompress />,
    },
];
