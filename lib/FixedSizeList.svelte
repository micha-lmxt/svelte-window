<script>
    import ListComponent from '../src/ListComponent.svelte';
    import specificProps from '../src/FixedSizeList';

    let g;
    export const scrollTo = (x)=>g?.scrollTo(x);
    export const scrollToItem = (x)=>g?.scrollToItem(x);
    let inst = {};
    export const instance = inst
    $: if (g) {
        Object.assign(inst,g.instance);
    }
</script>

<ListComponent bind:this={g} specificFunctionProps={specificProps} {...$$restProps} let:items><slot {items}/></ListComponent>
