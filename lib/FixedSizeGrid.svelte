<script>
    import GridComponent from '../src/GridComponent.svelte';
    import specificProps from '../src/FixedSizeGrid';

    let g;
    export const scrollTo = (x)=>g?.scrollTo(x);
    export const scrollToItem = (x)=>g?.scrollToItem(x)
    let inst = {};
    export const instance = inst
    $: Object.assign(inst,g.instance);

</script>

<GridComponent bind:this={g} specificFunctionProps={specificProps} {...$$restProps} let:items><slot {items}/></GridComponent>
