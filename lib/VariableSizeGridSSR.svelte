<script>
    import GridComponent from '../src/GridComponent.svelte';
    import specificProps from '../src/VariableSizeGrid';
    import { onMount } from "svelte";
    let g;
    export const scrollTo = (x)=>g?.scrollTo(x);
    export const scrollToItem = (x)=>g?.scrollToItem(x)
    let m = false;
    onMount(_=>m=true);
</script>
{#if m}
<GridComponent bind:this={g} specificFunctionProps={specificProps} {...$$restProps} let:items><slot {items}/></GridComponent>
{/if}