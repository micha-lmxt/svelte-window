<script>
    import GridComponent from '../src/GridComponent.svelte';
    import specificProps from '../src/FixedSizeGrid';
import { onMount } from 'svelte';
    let g;
    export const scrollTo = (x)=>g?.scrollTo(x);
    export const scrollToItem = (x)=>g?.scrollToItem(x)
    let m = false;
    onMount(_=>m=true)
    let inst = {};
    export const instance = inst
    $: Object.assign(inst,g.instance);
</script>
{#if m}
<GridComponent bind:this={g} specificFunctionProps={specificProps} {...$$restProps} let:items><slot {items}/></GridComponent>
{/if}