import "./styles.css";
const SVG = require("svg.js");
const honeycomb = require("honeycomb-grid");

// Initialize the SVG container element
const imageContainer = SVG(document.getElementById("svg-canvas"));

// create a hexagon factory
const Hex = honeycomb.extendHex({ size: 20 });

const Grid = honeycomb.defineGrid(Hex);
// get the corners of a hex (they're the same for all hexes created with the same Hex factory)
const corners = Hex().corners();

// in-memory representation of a grid of hexagons, from which the
// concrete hex grid will be rendered
const backingGrid = Grid.rectangle({ width: 46, height: 22 });
const IMAGE_OFFSET = 22;

SVG.Hexagon = SVG.invent({
  inherit: SVG.Shape,
  create() {
    return new SVG.Defs()
      .polygon(corners.map(({ x, y }) => `${x},${y}`))
      .fill({ color: "#fff", opacity: "0" });
    //.stroke({ width: "1", color: "#000", opacity: "0.1" });
  },
  construct: {
    hexagon(x, y) {
      return this.put(new SVG.Hexagon()).translate(x, y);
    }
  }
});

SVG.HexagonGroup = SVG.invent({
  inherit: SVG.G,
  create(grid) {
    const group = new SVG.G();

    grid.forEach(hex => {
      const { x, y } = hex.toPoint();
      group.add(this.hexagon(x, y));
    });

    return group;
  },
  construct: {
    hexagonGroup(backingHexagons) {
      return this.put(new SVG.HexagonGroup(backingHexagons));
    }
  }
});

const paintImage = ({ svg, url, offset, size }) => {
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

const hexagons = imageContainer.hexagonGroup(backingGrid);

// paint the initial image
const initialImage = paintImage({
  svg: imageContainer,
  url: "./src/img/series/series1-notes.png",
  offset: { x: IMAGE_OFFSET, y: IMAGE_OFFSET },
  size: { width: 600, height: 200 }
});

const maskingImage = paintImage({
  svg: imageContainer,
  url: "./src/img/phrases/series1.png",
  offset: { x: IMAGE_OFFSET, y: IMAGE_OFFSET },
  size: { width: 600, height: 200 }
});

imageContainer.use(hexagons);

const visibleMaskProps = {
  color: "#fff",
  opacity: "1"
};

// filter backing hexagon grid into a new list containing all hexagons
// that fall within the base image

const getMaskOverlap = (grid, shapes, mask, offset = 0) => {
  return grid.reduce((memo, polygon, index) => {
    const { x, y } = polygon.toPoint();

    if (
      mask.inside(x, y) ||
      mask.inside(x - offset, y) ||
      mask.inside(x + offset, y) ||
      mask.inside(x + offset, y - offset) ||
      mask.inside(x - offset, y + offset) ||
      mask.inside(x, y - offset) ||
      mask.inside(x, y + offset) ||
      mask.inside(x + offset, y + offset)
    ) {
      memo = [
        {
          svg: shapes.get(index),
          memory: polygon
        },
        ...memo
      ];
    }

    return memo;
  }, []);
};

const hexagonsInImage = getMaskOverlap(backingGrid, hexagons, maskingImage);
const hexImageMask = imageContainer.mask();
const getRandomBetween = (min, max) => Math.floor(Math.random() * max) + min;
const selected = {};
const loopLength = hexagonsInImage.length;
const time = 1000;
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
    .stroke({ width: 1, color: "#000", opacity: "1" })

    .after(() => {
      svg
        .stroke({ width: 1, color: "#000", opacity: "1" })
        .animate()
        .fill(visibleMaskProps)

        .after(() =>
          hexImageMask.add(
            svg
              //.translate(inMemoryGridPoint.x - 22, inMemoryGridPoint.y - 22)
              .stroke({ width: 1, color: "#000", opacity: "1" })
          )
        );
    });
}, 500);

maskingImage.maskWith(hexImageMask).maskWith(hexagons);
