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
const IMAGE_OFFSET = 22;

SVG.Hexagon = SVG.invent({
  inherit: SVG.Shape,
  create() {
    return new SVG.Defs()
      .polygon(corners.map(({ x, y }) => `${x},${y}`))
      .fill({ color: "#fff", opacity: "0" })
      .stroke({ width: "1", color: "#000", opacity: "0.9" });
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

const paintImage = ({ svg, url, offset, size }) => {
  console.log(size);
  const image = size
    ? svg.image(url, size.width, size.height)
    : svg.image(url).loaded(function(imgData) {
        image.size(imgData.width, imgData.height);
      });

  if (offset) {
    image.translate(offset.x, offset.y);
  }

  return image;
};

const hexagons = photoHex2.hexagonGroup();

// paint the initial image
paintImage({
  svg: photoHex2,
  url: "./src/img/place-cat-a.jpeg",
  offset: { x: IMAGE_OFFSET, y: IMAGE_OFFSET }
});

const catImageB = photoHex2
  .image("./src/img/place-cat-b.jpeg", 400, 200)
  .translate(IMAGE_OFFSET, IMAGE_OFFSET);
// paintImage({
//   svg: photoHex2,
//   url: "./src/img/place-cat-b.jpeg",
//   offset: { x: 22, y: 22 }
// });

// this is the image that will mask the initial one
// photoHex2.image("./src/img/place-cat-b.jpeg").translate(IMAGE_OFFSET, IMAGE_OFFSET)
// const catImageB = photoHex2
//   .image("./src/img/place-cat-b.jpeg", 400, 200)
//   .translate(IMAGE_OFFSET, IMAGE_OFFSET);

photoHex2.use(hexagons);

const visibleMaskProps = {
  color: "#fff",
  opacity: "1"
};

// filter backing hexagon grid into a new list containing all hexagons
// that fall within the base image
const hexagonsInImage = backingGrid.reduce((memo, hexagon, index) => {
  const { x, y } = hexagon.toPoint();

  if (
    catImageB.inside(x, y) ||
    catImageB.inside(x - 22, y) ||
    catImageB.inside(x + 22, y) ||
    catImageB.inside(x + 22, y - 22) ||
    catImageB.inside(x - 22, y + 22) ||
    catImageB.inside(x, y - 22) ||
    catImageB.inside(x, y + 22) ||
    catImageB.inside(x + 22, y + 22)
  ) {
    memo = [
      {
        svg: hexagons.get(index),
        memory: hexagon
      },
      ...memo
    ];
  }

  return memo;
}, []);

const hexImageMask = photoHex2.mask();
const getRandomBetween = (min, max) => Math.floor(Math.random() * max) + min;
const selected = {};
const loopLength = hexagonsInImage.length;
const time = 50;
let i = 0;

const animationLoop = setInterval(() => {
  if (i >= loopLength) {
    clearInterval(animationLoop);
    return;
  }

  let nextIndex = getRandomBetween(0, loopLength);

  while (selected[nextIndex]) {
    nextIndex = getRandomBetween(0, loopLength);
  }

  selected[nextIndex] = true;
  i = i + 1;

  const { svg, memory } = hexagonsInImage[nextIndex];
  const inMemoryGridPoint = memory.toPoint();

  svg
    .animate(time)
    .fill({
      opacity: "1",
      color: "none"
    })

    .after(() => {
      svg
        .animate()
        .fill(visibleMaskProps)
        .after(() =>
          hexImageMask.add(
            svg.translate(inMemoryGridPoint.x - 22, inMemoryGridPoint.y - 22)
          )
        );
    });
}, time);

catImageB.maskWith(hexImageMask);
