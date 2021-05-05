# svelte-window

> Svelte components for efficiently rendering large, scrollable lists and tabular data. Port of react-window to Svelte.

Svelte window works by only rendering *part* of a large data set (just enough to fill the viewport). This helps address some common performance bottlenecks:
1. It reduces the amount of work (and time) required to render the initial view and to process updates.
2. It reduces the memory footprint by avoiding over-allocation of DOM nodes.

[![NPM license](https://img.shields.io/badge/license-mit-red.svg?style=for-the-badge)](LICENSE.md)

## Install

```bash
npm install --save-dev svelte-window
```

## Usage

This library is a port of react-window, here are some examples: [react-window.now.sh](https://react-window.now.sh/).

This is how to render a basic list:


```javascript
<script>
    import { FixedSizeList as List, styleString as sty } from 'svelte-window';
</script>
<List
height={150}
itemCount={1000}
itemSize={35}
width={300}
let:items>
    {#each items as it (it.key)}
        <div style={sty(it.style)}>Row {it.index}</div>        
    {/each}
</List>
```

Here is another example with a fixed size grid with a scroll-to button, scrolling indicators:

```javascript
<script>
  import { FixedSizeGrid as Grid, styleString as sty } from 'svelte-window'

  let grid

  const click = () => {
    if (grid) {
      grid.scrollToItem({
        align: 'start',
        columnIndex: 150,
        rowIndex: 300,
      })
    }
  }
</script>

<Grid
  bind:this={grid}
  columnCount={1000}
  columnWidth={100}
  height={150}
  rowCount={1000}
  rowHeight={35}
  width={300}
  useIsScrolling
  let:items>
  {#each items as it (it.key)}
    <div style={sty(it.style)}>
      {it.isScrolling ? 'Scrolling' : `Row ${it.rowIndex} - Col ${it.columnIndex}`}
    </div>
  {/each}
</Grid>

<button on:click={click}> To row 300, column 150 </button>
```

## Differences to the React library

1. Grids and lists don't actively render the children. Instead, an array of item information is passed down via item props. You can use the [let:item](https://svelte.dev/tutorial/slot-props) to access it and render with the [each block](https://svelte.dev/tutorial/each-blocks).
2. Styles are passed down as objects, like in the React library, but Svelte only accepts strings for style. A helper function `styleString` is exported from `svelte-window`, to convert the style object to string
3. Variable sized variants have utilities to reset the cache, when row/cell sizes change. These are not directly added to the class, but to a member called `instance`. Eg. instead of

```javascript
list.resetAfterIndex(...)
```

use 

```javascript
list.instance.resetAfterIndex(...)
```

Affected functions:

VariableSizeList:

- resetAfterIndex

VariableSizeGrid:

- resetAfterIndices
- resetAfterColumnIndex
- resetAfterRowIndex

## Related libraries

* [`svelte-virtualized-auto-sizer`](https://npmjs.com/package/svelte-virtualized-auto-sizer): HOC that grows to fit all of the available space and passes the width and height values to its child.

## More information

[Here is a blog post](https://gradientdescent.de/porting-react-window) about how the library was ported from React to Svelte.

