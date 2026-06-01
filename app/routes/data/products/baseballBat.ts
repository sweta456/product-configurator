const baseballBat = {
  id: "baseball-bat",

  name: "Baseball Bat",

  views: {
    front: {
      width: 1200,
      height: 900,

      layers: [
        {
          id: "shadow",
          type: "image",
          src: "/products/baseball-bat/shadow.png",
        },

        {
          id: "handle",
          type: "colorable",
          src: "/products/baseball-bat/handle.png",
          color: "#d2b48c",
        },

        {
          id: "barrel",
          type: "colorable",
          src: "/products/baseball-bat/barrel.png",
          color: "#ff0000",
        },

        {
          id: "ring",
          type: "colorable",
          src: "/products/baseball-bat/ring.png",
          color: "#000000",
        },
      ],
    },
  },
};

export default baseballBat;