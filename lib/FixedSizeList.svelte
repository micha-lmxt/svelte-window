<script>
    import ListComponent from '../src/ListComponent.svelte';
    import specificProps from '../src/FixedSizeList';
    
    let g;
    export const scrollTo = (x)=>g?.scrollTo(x);
    export const scrollToItem = (x)=>g?.scrollToItem(x);

</script>

<ListComponent bind:this={g} specificFunctionProps={specificProps} {...$$restProps} let:items><slot {items}/></ListComponent>
