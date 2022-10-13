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


```svelte
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

```svelte
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

#### Calendar example with VariableSizeGrid

Here is a more complex example. Each column represents a date, workday coluns are wider than weekend columns. A sparse dataset is called.

```svelte
<script lang="ts">
  import { VariableSizeGrid as Grid, styleString as sty } from 'svelte-window';
  const startDate = new Date("1/1/2022");
  const dateCell = (rowIndex:number,columnIndex:number)=>{
    return new Date(startDate.getTime() + 
      1000 * 60 * 60 * 8  + // start at 8 o'clock
      1000 * 60 * 60 * rowIndex + // each row adds an hour
      1000 * 60 * 60 * 24 * columnIndex // each column adds a day
    )
  }
 
  const isWorkday = (index)=>{
    const offset = startDate.getDay();
    const d = (index + offset) % 7;
    //return true on monday to friday
    return d!==0 && d !== 6; 
  }

  const columnWidth = (index)=>isWorkday(index) ? 200 : 100

  //round date to full hours
  const formatDate = (date:Date)=>Math.round(date.getTime() / (1000 * 60 * 60 )) 

  //sparse event data
  const rawEvents = [
    {date:new Date("1/4/2022 10:00"), event:"Pilates"},
    {date:new Date("1/11/2022 11:00"), event:"Zumba"},
    {date:new Date("1/18/2022 11:00"), event:"Pilates"},
    {date:new Date("1/25/2022 10:00"), event:"Zumba"},
    //etc.
  ]
  
  //format for quick access
  const events = rawEvents.reduce(
    (p,v)=>{
      p[formatDate(v.date)] = v
      return p
    },{}
  )
  
</script>

<Grid
  columnCount={1000}
  {columnWidth}
  height={150}
  rowCount={12}
  rowHeight={()=>95}
  width={300}
  let:items>
  {#each items as it (it.key)}
    <div style={sty(it.style)}>
      {dateCell(it.rowIndex, it.columnIndex)}
      {#if events[formatDate(dateCell(it.rowIndex,it.columnIndex))]}
        {events[formatDate(dateCell(it.rowIndex,it.columnIndex))].event}
      {/if}
    </div>
  {/each}
</Grid>
```


### SvelteKit

This section is probably obsolete. SvelteKit is pretty stable today, so no problems should occur. 
----
SvelteKit is in public beta, so a 100% compatibility cannot be guaranteed. Since version 1.2.0 `svelte-window` should work with SvelteKit when imported as a devDependency (`npm i --save-dev svelte-window`). By design, `svelte-window` is a client side library. Normal components like `FixedSizeList` need to be guarded from server-side-rendering (eg. with a `{#if mounted}...` clause). For convenience, there are SSR counterparts to all four components, which handle guarding within the library: `FixedSizeListSSR`, `FixedSizeGridSSR`, `VariableSizeListSSR`, `VariableSizeGridSSR`. In the examples above, just change eg.:

```javascript
<script>
    import { FixedSizeList as List, styleString as sty } from 'svelte-window';
</script>
...
```

to 

```javascript
<script>
    import { FixedSizeListSSR as List, styleString as sty } from 'svelte-window';
</script>
...
```
---

## Bundle Size

If you don't use all of `svelte-window`s components on a page, you can minimize the bundle size by using direct imports from the `lib` folder. Eg. you can change imports like this

```javascript
import { FixedSizeListSSR as List, styleString as sty } from 'svelte-window';
```

to

```javascript
import List from 'svelte-window/lib/FixedSizeListSSR.svelte';
import {styleString as sty} from 'svelte-window/src/styleString';
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

