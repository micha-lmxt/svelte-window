<script>
    import ListComponent from '../src/ListComponent.svelte';
    import specificProps from '../src/VariableSizeList';
    import { onMount } from "svelte";
    let g;
    export const scrollTo = (x)=>g?.scrollTo(x);
    export const scrollToItem = (x)=>g?.scrollToItem(x);
    let m = false;
    onMount(_=>m=true);
</script>
{#if m}
<ListComponent bind:this={g} specificFunctionProps={specificProps} {...$$restProps} let:items><slot {items}/></ListComponent>
{/if}