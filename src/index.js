import "./styles.css";
const SVG = require("svg.js");
const honeycomb = require("honeycomb-grid");

const photoHex1 = SVG(document.getElementById("photo-hex-1"));
const photoHex2 = SVG(document.getElementById("photo-hex-2"));

// create a hexagon factory
const Hex = honeycomb.extendHex({ size: 20, offset: -1 });

const Grid = honeycomb.defineGrid(Hex);
// get the corners of a hex (they're the same for all hexes created with the same Hex factory)
const corners = Hex().corners();
const backingGrid = Grid.rectangle({ width: 30, height: 30 });

SVG.Hexagon = SVG.invent({
  inherit: SVG.Shape,
  create() {
    return new SVG.Defs()
      .polygon(corners.map(coords => `${coords.x},${coords.y}`))
      .fill({ color: "#fff", opacity: "0.1" })
      .stroke({ width: "2", color: "#fff", opacity: "0.1" });
  },
  construct: {
    hexagon(x, y) {
      return this.put(new SVG.Hexagon()).translate(x, y);
    }
  }
});

SVG.HexagonGroup = SVG.invent({
  inherit: SVG.G,
  create() {
    const group = new SVG.G();

    backingGrid.forEach(hex => {
      const { x, y } = hex.toPoint();
      group.add(this.hexagon(x, y));
    });

    return group;
  },

  extend: {},

  construct: {
    hexagonGroup() {
      return this.put(new SVG.HexagonGroup());
    }
  }
});

SVG.ResourceImage = SVG.invent({
  inherit: SVG.Shape,
  create: "image"
});

const hexes = photoHex1.hexagonGroup();

console.log(hexes.children().length);

// baseImage.maskWith(hexes);

const catImageA = photoHex2
  .image("./src/img/place-cat-a.jpeg")
  .loaded(function(loader) {
    this.size(loader.width, loader.height);
  });
const catImageB = photoHex2
  .image("./src/img/place-cat-b.jpeg")
  .loaded(function(loader) {
    this.size(loader.width, loader.height);
  });

const visibleMaskProps = {
  color: "#fff",
  opacity: "1"
};

/**
 * set a number n
 * set a hash of checked hexagons to {}
 * set an array of hexagon elements to []
 * get all children in the hexagon grid and
 *  filter those children by the underlying image's bounding box
 *
 * - get n random hexagons.
 * - filter those hexagons by checking if they are within the target
 * image's bounding box
 * - if they are, add to array of hexagons
 * - add index to checked hash
 *
 * - repeat until hexagon[] === n
 *
 */

photoHex2.use(hexes);

const hexImageMask = photoHex2.mask();
const count = 7;
let i = 0;

const cancelLoop = setInterval(() => {
  if (i === count) {
    clearInterval(cancelLoop);
  }

  hexImageMask.add(hexes.get(i).fill(visibleMaskProps));

  i += 1;
}, 250);

console.log(hexes.get(1).bbox());

//catImageB.maskWith(hexImageMask);
