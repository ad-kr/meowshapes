## 🐱 meowshapes

A simple library for easy visualizations powering the renderer for [meowshapes.com](https://meowshapes.com).

The best way to use meowshapes is to use the online [editor](https://meowshapes.com/editor). It is however also possible to use the library directly in your own projects.

**Note!** This package is very tightly coupled to the meowshapes.com website. There is no build process, no packaging or testing. It should work though 🤷

### Installation and setup

Get the package:

```bash
npm install meowshapes
```

Define a drawing function that receives a rendering context. Use this context to create shapes and visualizations:

```js
const draw = (ctx) => {
	ctx.grid();
	ctx.sphere(32).color("red");
};
```

Then set up a renderer in your code:

```js
import { Renderer } from "meowshapes";

const renderer = new Renderer(draw);

document.body.appendChild(renderer.element());

// Dispose when done
renderer.dispose();
```

### Docs

For full documentation, see [meowshapes.com/docs](https://meowshapes.com/docs).
