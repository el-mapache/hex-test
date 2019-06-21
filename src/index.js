import "./styles.css";
const SVG = require("svg.js");
const honeycomb = require("honeycomb-grid");

// Initialize the SVG container element
const photoHex2 = SVG(document.getElementById("photo-hex-2"));

// create a hexagon factory
const Hex = honeycomb.extendHex({ size: 20 });

const Grid = honeycomb.defineGrid(Hex);
// get the corners of a hex (they're the same for all hexes created with the same Hex factory)
const corners = Hex().corners();

// in-memory representation of a grid of hexagons, from which the
// concrete hex grid will be rendered
const backingGrid = Grid.rectangle({ width: 22, height: 22 });

SVG.Hexagon = SVG.invent({
  inherit: SVG.Shape,
  create() {
    return new SVG.Defs()
      .polygon(corners.map(({ x, y }) => `${x},${y}`))
      .fill({ color: "#fff", opacity: "0" })
      .stroke({ width: "1", color: "#bbb", opacity: "0.1" });
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
  construct: {
    hexagonGroup() {
      return this.put(new SVG.HexagonGroup());
    }
  }
});

const hexagons = photoHex2.hexagonGroup();

const catImageA = photoHex2
  .image("./src/img/place-cat-a.jpeg", 400, 400)
  .translate(22, 22);
const catImageB = photoHex2
  .image("./src/img/place-cat-b.jpeg", 400, 200)
  .translate(22, 22);

const actualHexagons = hexagons.children().filter(hexagonSVG => {
  //const { x, y } = hexagonSVG.point();
  console.log(hexagonSVG, hexagonSVG.attr(), hexagonSVG.y());
  return catImageB.inside(hexagonSVG.x(), hexagonSVG.y());
});

console.log(actualHexagons, actualHexagons.length);

photoHex2.use(hexagons);

const visibleMaskProps = {
  color: "#fff",
  opacity: "1"
};

// filter backing hexagon grid into a new list containing all hexagons
// that fall within the base image
const hexagonsInImage = backingGrid.filter(hexagon => {
  const { x, y } = hexagon.toPoint();
  return catImageB.inside(x, y);
});

console.log(hexagonsInImage.length);

const hexAtIndex = index => ({
  svg: hexagons.get(index),
  memory: backingGrid.get(index)
});

/**
 * regardless of what index is chosen here, the offsets used below for the
 * first item aadded to the mask are always the same. The correct portion
 * of the image masking the original is shown, however?
 */

const hexImageMask = photoHex2.mask();

const getRandomBetween = (min, max) => Math.floor(Math.random() * max) + min;

const chosenIndicies = {};

const loopLength = hexagonsInImage.length;
let i = 0;

// const animationLoop = setInterval(() => {
//   if (i === loopLength) {
//     clearInterval(animationLoop);
//     return;
//   }

//   let nextIndex = getRandomBetween(0, loopLength);

//   while (chosenIndicies[nextIndex]) {
//     nextIndex = getRandomBetween(0, loopLength);
//   }

//   chosenIndicies[nextIndex] = true;

//   const { svg, memory } = hexAtIndex(nextIndex);
//   const inMemoryGridPoint = memory.toPoint();
//   const nextHex = svg
//     .translate(inMemoryGridPoint.x - 22, inMemoryGridPoint.y - 22)
//     .fill(visibleMaskProps);

//   nextHex
//     .animate(2000)
//     .fill({
//       opacity: "1",
//       color: "none"
//     })
//     .after(() => {
//       nextHex
//         .animate()
//         .fill(visibleMaskProps)
//         .after(() => hexImageMask.add(nextHex));
//     });

//   i += 1;
// }, 100);

catImageB.maskWith(hexImageMask);
